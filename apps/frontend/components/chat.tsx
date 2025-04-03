'use client'

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useEffect, useState } from "react"
import { z } from "zod"
import { toast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card"
import { Agent, getAgent, getAgentStartTaskStatus, startAgent } from "@/lib/api/agent"
import { getRuntime } from "@/lib/api/runtime"
import { AgentStartTask, TaskStatus } from "@/lib/api/task"
import { Skeleton } from "./ui/skeleton"
import { UrlResourceForbiddenError, UrlResourceUnauthorizedError } from "@/lib/api/common"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"

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
  const [agentStartTaskStatus, setAgentStartTaskStatus] = useState<AgentStartTask>()
  const [chat, setChat] = useState<Message[]>([])
  const { user } = useDynamicContext()

  useEffect(() => {
    if (!agent.runtimeId && !agentStartTaskStatus) {
      const wakeAgent = async () => {
        try {
          const runtime = await getRuntime()
          setAgentStartTaskStatus(await startAgent(agent.id, runtime.id))
        } catch (error) {
          console.error(error)
          if (error instanceof UrlResourceUnauthorizedError) {
            toast({
              title: "Unable to wake agent!",
              description: "You must be logged in and own this agent to wake it up.",
            })
          } else if (error instanceof UrlResourceForbiddenError) {
            toast({
              title: "Unable to wake agent!",
              description: "You do not own this agent and cannot wake it up.",
            })
          }
        }
      }

      console.log("Agent", agent.characterJson.name, "not awake, waking up now")
      wakeAgent()
    } else if (!agent.runtimeId && agentStartTaskStatus) {
      const { agentId, runtimeId } = agentStartTaskStatus
      const pollAgentStartTaskStatus = async () => {
        try {
          // TODO: configurable maxTries
          // TODO: configurable delay (in ms)
          const delay = 30000
          const maxTries = 15
          const arr = [...Array(maxTries).keys()]
          startLoop: for (const i of arr) {
            console.debug(
              "Waiting for agent", agentId,
              "to start up for runtime", runtimeId,
            )

            const status = await getAgentStartTaskStatus(
              agentId,
              runtimeId,
              delay,
            )
            switch (status) {
              case TaskStatus.SUCCESS:
                console.log(
                  "Agent", agentId,
                  "successfully started on", runtimeId,
                )
                break startLoop;
              case TaskStatus.FAILURE:
                throw new Error("Agent Start Task Status failed!!!")
              case TaskStatus.PENDING:
              case TaskStatus.STARTED:
            }

            if (i === maxTries - 1)
              throw new Error(`Couldn't wake up ${agent.characterJson.name} after ${maxTries} tries!!!`)
          }

          const newAgent = await getAgent(agent.id)
          setAgent(newAgent)
        } catch (error) {
          console.error(error)
          if (error instanceof Error) {
            toast({
              title: "Unable to start agent chat!",
              description: error.message,
            })
          }
        }
      }
      
      pollAgentStartTaskStatus()
     } else {
      console.debug("Agent", agent.characterJson.name, "is up an running")
    }
  }, [agent, agentStartTaskStatus])

  const senderName = user ? `${user} (You)` : 'You'

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    }
  })

  async function onSubmit(formData: z.infer<typeof formSchema>) {
    try {
      // TODO: global chat???
      setChat(msgs => msgs.concat({
        id: (msgs.length > 0) ? msgs[msgs.length - 1].id + 1: 1,
        text: formData.message,
        sender: senderName, // TODO: get user name here if applicable
      }))

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
    <div className="flex flex-col w-full justify-start items-center gap-8">
      <ScrollArea className="bg-anakiwa-darker/50 w-full h-96 lg:h-[600px] rounded-xl p-2">
        <ol className="flex flex-col w-full">
          {chat.map(message => (
            <li
              key={message.id}
              className={(message.sender === senderName) ? right : left}
            >
              <Card className="max-w-3/4 break-words">
                <CardHeader>
                  <CardTitle>{message.sender}</CardTitle>
                  <Separator />
                </CardHeader>
                <CardContent>{message.text}</CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </ScrollArea>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-4/5 space-y-4">
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea placeholder="Type your message here." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Send message</Button>
        </form>
      </Form>
    </div> : <div className="flex flex-col w-full justify-start items-center gap-8">
      <Skeleton className="w-full h-96 lg:h-[600px] rounded-xl p-2" />
      Waking agent up
    </div>
  }
  </div>)
}