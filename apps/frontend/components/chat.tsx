'use client'

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState } from "react"
import { z } from "zod"
import { toast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card"

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
  elizaId,
  runtimeUrl,
}: {
  elizaId: string,
  runtimeUrl: string,
}) {
  const chatUrl = new URL(`${elizaId}/message`, runtimeUrl)
  const [chat, setChat] = useState<Message[]>([])
  const senderName = 'You'

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
        chatUrl,
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
    </div>
  )
}