'use client'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDynamicContext, UserProfile } from "@dynamic-labs/sdk-react-core"
import { getUser } from "@/lib/api/user";
import {
  createAgent,
  getAgentStartTaskStatus,
  startAgent,
} from "@/lib/api/agent";
import {
  createRuntime,
  getRuntimes,
  Runtime,
} from "@/lib/api/runtime";
import { TaskStatus } from "@/lib/api/task";


const MAX_FILE_SIZE = 5000000;
const formSchema = z.object({
  characterFile: z
    .instanceof(File)
    .refine(file => file.size !== 0, "File may not be empty.")
    .refine(file => file.size < MAX_FILE_SIZE, "Max file size is 5MB.")
    .refine(file =>
      [
        ".json",
        "application/json",
      ].includes(file.type),
      { message: "Invalid file type, must be JSON." }
    ),
    // TODO validate against Character JSON schema
  env: z.string(),
  // character JSON schema
  name: z.string(),
  bio: z.string().array().min(1),
  lore: z.string().array().min(1),
  messageExamples: z.object({
    user: z.string(),
    content: z.object({
      text: z.string(),
      action: z.string().optional(),
    })
  }).array().min(1).array().min(1),
  postExamples: z.string().array().min(1),
  adjectives: z.string().array().min(1),
  topics: z.string().array().min(1),
  knowledge: z.object({
    id: z.string(),
    path: z.string(),
    content: z.string(),
  }).array().optional(),
  style: z.object({
    all: z.string().array().min(1),
    chat: z.string().array().min(1),
    post: z.string().array().min(1),
  }),
})

export default function CreationForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      env: "",
    }
  })
  // TODO: set up sei and eth addresses if undefined

  const { user } = useDynamicContext()
  if (!user)
    throw new Error(`User ${user} does not exist!`)
  if (!user.userId)
    throw new Error(`User ${user} has no userId!`)

  async function onSubmit(formData: z.infer<typeof formSchema>) {
    try {
      const characterFile = await formData.characterFile.text()
      const characterJson = JSON.parse(characterFile) // TODO: catch SyntaxError
      console.debug(characterJson)

      const env = formData.env
      console.debug(".env", env)

      const apiUser = await getUser({
        // TS not able to use user assertion from outside of function
        dynamicId: (user as UserProfile).userId as string
      })

      const agentPayload = {
        ownerId: apiUser.id,
        characterJson: characterJson,
        envFile: env,
      }

      const agent = await createAgent(agentPayload)
      const unusedRuntimes = await getRuntimes()
      // if no unused runtime, get a random one
      // TODO: delete once getlatestruntime is implemented on API
      const runtime: Runtime = unusedRuntimes.length ?
        unusedRuntimes[0] :
        await (async () => {
          console.log("No unused runtimes to start an agent, getting a random runtime")
          const runtimes: Runtime[] = (
            await getRuntimes(false)
            .then(list => list.length ? list : Promise.all([createRuntime()]))
          )
          return runtimes[Math.floor(Math.random() * runtimes.length)]
        })()

      startAgent(agent.id, runtime.id)
      toast({
        title: "Agent Created!",
        description: "Agent has been defined, but is still waiting to start up.",
      })

      // TODO: configurable maxTries
      // TODO: configurable delay (in ms)
      const delay = 30000
      const maxTries = 15
      const arr = [...Array(maxTries).keys()]
      startLoop: for (const i of arr) {
        console.log(
          "Waiting for agent", agent.id,
          "to start up for runtime", runtime.id,
          "at", runtime.url,
        )

        const status = await getAgentStartTaskStatus(
          agent.id,
          runtime.id,
          delay,
        )
        switch (status) {
          case TaskStatus.SUCCESS:
            console.log(
              "Agent", agent.id,
              "successfully started on", runtime.id,
            "at", runtime.url,
          )
            toast({
              title: "Success!",
              description: "Agent defined and started! You can now fully interact with it.",
            })
            break startLoop;
          case TaskStatus.FAILURE:
            throw new Error("Agent Start Task Status failed!!!")
          case TaskStatus.PENDING:
          case TaskStatus.STARTED:
            toast({
              title: "Still waiting for agent to start..."
            })
        }

        if (i === maxTries - 1)
          throw new Error(`Agent Start Task Status timed out after ${maxTries} tries!!!`)
      }
    } catch (error) {
      toast({
        title: "Something went wrong. Please try again",
      });
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="characterFile"
          render={({ field: { value, onChange, ...fieldProps } }) => ( // eslint-disable-line
            <FormItem>
              <FormLabel>Character JSON</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".json,application/json"
                  onChange={ event =>
                    onChange(event.target.files && event.target.files[0])
                  }
                  {...fieldProps}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="env"
          render={({ field }) => (
            <FormItem>
              <FormLabel>.env</FormLabel>
              <FormControl>
                <Input
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}