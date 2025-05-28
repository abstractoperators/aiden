'use client'

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useEffect, useRef, useState } from "react"
import { z } from "zod"
import { toast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card"
import { Agent, getAgent, getAgentStartTaskStatus, startAgent } from "@/lib/api/agent"
import { AgentStartTask, TaskStatus } from "@/lib/api/task"
import { Skeleton } from "./ui/skeleton"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { getDisplayName } from "@/lib/dynamic/user"
import { isErrorResult, isSuccessResult } from "@/lib/api/result"
import { LoaderCircle, SendHorizontal } from "lucide-react"
import TextareaAutosize from "react-textarea-autosize"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  message: z.string(),
})

interface Message {
  id: number,
  text: string,
  sender: string,
}

interface AgentMessage {
  user: string,
  text: string,
  action: string,
}

const left = "m-4 flex flex-col justify-center items-start text-left"
const right = "m-4 flex flex-col justify-center items-end text-right"

export default function Chat({
  init,
}: {
  init: Agent,
}) {
  const [agent, setAgent] = useState<Agent>(init)
  const [agentStartTask, setAgentStartTask] = useState<AgentStartTask>()
  const [chat, setChat] = useState<Message[]>([])

  const { user, primaryWallet } = useDynamicContext()
  const senderName = (user && primaryWallet) ? `${getDisplayName(user, primaryWallet)} (You)` : 'You'

  const chatBottomRef = useRef<HTMLLIElement | null>(null)

  useEffect(() => {
    const failureToast = (description?: string) => toast({
      title: `Unable to wake Agent ${agent.characterJson.name}!`,
      description,
    })

    if (!agent.runtimeId && !agentStartTask) {
      const wakeAgent = async () => {
        const startResult = await startAgent({agentId: agent.id})
        if (isErrorResult(startResult)) {
          console.error(startResult.message)
          switch (startResult.code) {
            case 400:
              failureToast(
                "AIDEN overloaded! Please contact the AIDEN support team."
              )
              return
            case 401:
              failureToast(
                "You must be logged in and own this agent to wake it up."
              )
              return
            case 403:
              failureToast(
                "You do not own this agent and cannot wake it up."
              )
              return
            case 404:
              failureToast(
                "This agent does not exist on AIDN servers :(."
              )
              return
            case 500:
              failureToast(
                "An error occurred on AIDN's servers...please notify the AIDN support team."
              )
              return
          }
        }
        setAgentStartTask(startResult.data)
      }

      console.debug("Agent", agent.characterJson.name, "not awake, waking up now")
      toast({
        title: `Agent ${agent.characterJson.name} not awake.`,
        description: `Please wait while we wake ${agent.characterJson.name} up!`,
      })
      wakeAgent()
    } else if (!agent.runtimeId && agentStartTask) {
      const { agentId, runtimeId } = agentStartTask

      pollAgent({
        agentId,
        runtimeId,
        async successCallback() {
          const agentResult = await getAgent(agentId)
          if (isErrorResult(agentResult)) {
            toast({
              title: "Unable to update agent on successful start!",
              description: agentResult.message,
            })
            return
          }

          toast({
            title: `Agent ${agent.characterJson.name} is awake!`,
            description: `You may now interact with ${agent.characterJson.name}`,
          })
          setAgent(agentResult.data)
        },
        failureCallback() { failureToast(
          "An error occurred on AIDN's servers! Please notify the AIDN support team."
        )},
        pendingStartingCallback() { toast({
          title: `Still waiting for agent ${agent.characterJson.name} to start...`
        })},
        maxTriesCallback() { failureToast(
          "An error occurred on AIDN's servers! Please notify the AIDN support team."
        )},
      })
     } else {
      console.debug("Agent", agent.characterJson.name, "is up and running")
    }
  }, [agent, agentStartTask])

  useEffect(() => {
    if (chat.length === 0)
      return

    const lastMessage = chat[chat.length - 1]
    const isNotFromUser = lastMessage.sender !== senderName

    if (isNotFromUser)
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat, senderName])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    }
  })

  const { control, handleSubmit, formState } = form

  const isLoading = formState.isSubmitting

  async function onSubmit(formData: z.infer<typeof formSchema>) {
    if (formData.message.length === 0)
      return
    try {
      // TODO: global chat???
      setChat(msgs => msgs.concat({
        id: (msgs.length > 0) ? msgs[msgs.length - 1].id + 1: 1,
        text: formData.message,
        sender: senderName, // TODO: get user name here if applicable
      }))

      form.setValue(
        "message",
        "",
        { shouldDirty: false, shouldTouch: false },
      )

      // TODO: better wait indicator/feedback
      // TODO: move to server side
      const response = await fetch(
        new URL(`${agent.elizaAgentId}/message`, agent.runtime?.url),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user: "user",
            text: formData.message,
          }),
        }
      )

      if (!response.ok) throw new Error("Failed to message agent")

      const responseBody: AgentMessage[] = await response.json()

      responseBody.map(message => {
        setChat(msgs => msgs.concat({
          id: msgs[msgs.length - 1].id + 1,
          text: message.text,
          sender: message.user,
        }))
      })

      form.reset()
    } catch (error) {
      toast({
        title: "Something went wrong. Please try again",
      });
      console.error(error);
    }
  }

  return (
  <div>
  {agent.runtimeId ? 
    <Card className="justify-start items-center">
      <ScrollArea className="bg-anakiwa-darker/50 w-full h-96 lg:h-[600px] rounded-xl p-2">
        <ol className="flex flex-col w-full">
          {chat.map(message => (
            <li
              key={message.id}
              className={(message.sender === senderName) ? right : left}
            >
              <Card className="w-4/5 break-words">
                <CardHeader>
                  <CardTitle>{message.sender}</CardTitle>
                  <Separator />
                </CardHeader>
                <CardContent>{message.text}</CardContent>
              </Card>
            </li>
          ))}
          <li ref={chatBottomRef} />
        </ol>
      </ScrollArea>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="w-full flex gap-2">
          <FormField
            control={control}
            name="message"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <TextareaAutosize
                    minRows={2}
                    className={cn(
                      "flex w-full rounded-xl",
                      "border border-input bg-transparent px-3 py-2",
                      "text-base shadow-sm placeholder:text-muted-foreground",
                      "focus-visible:outline-none focus-visible:ring-1",
                      "focus-visible:ring-ring disabled:cursor-not-allowed",
                      "disabled:opacity-50 md:text-sm resize-none",
                    )}
                    placeholder="Type your message here. Press enter to submit and shift + enter for a new line."
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        e.currentTarget.form?.requestSubmit()
                      }
                    }}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} size="icon">
          { isLoading ?
            <LoaderCircle className="animate-spin" /> :
            <SendHorizontal />
          }
          </Button>
        </form>
      </Form>
    </Card> : <Card className="justify-start items-center">
      <Skeleton className="w-full h-96 lg:h-[600px] rounded-xl p-2" />
      <p>Waking agent up</p>
    </Card>
  }
  </div>)
}

async function pollAgent({
  agentId,
  runtimeId,
  successCallback = () => {},
  failureCallback = () => {},
  pendingStartingCallback = () => {},
  maxTriesCallback = () => {},
  delay = 30000,
  maxTries = 15,
}: {
  agentId: string,
  runtimeId?: string,
  successCallback?: () => void,
  failureCallback?: () => void,
  pendingStartingCallback?: () => void,
  maxTriesCallback?: () => void,
  delay?: number,
  maxTries?: number,
}): Promise<void> {
  const arr = [...Array(maxTries).keys()]
  for (const _ of arr) { // eslint-disable-line @typescript-eslint/no-unused-vars
    console.debug(
      "Waiting for agent", agentId,
      "to start up for runtime", runtimeId,
    )

    const taskStatus = await getAgentStartTaskStatus(
      {
        agentId,
        runtimeId,
      },
      delay,
    )

    if (isSuccessResult(taskStatus)) {
      switch (taskStatus.data) {
        case TaskStatus.SUCCESS:
          console.log(
            "Agent", agentId,
            "successfully started on", runtimeId,
          )
          successCallback()
          return
        case TaskStatus.FAILURE:
          failureCallback()
          console.error(
            `Agent Start Task Status failed for agent ${agentId} runtime ${runtimeId} !!!`
          )
          return
        case TaskStatus.PENDING:
        case TaskStatus.STARTED:
          pendingStartingCallback()
      }
    }
  }

  maxTriesCallback()
  console.error(`Agent Start Task Status for agent ${agentId} runtime ${runtimeId} timed out after ${maxTries} tries!!!`)
}
