'use client'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDynamicContext, UserProfile } from "@dynamic-labs/sdk-react-core"
import { getUser } from "@/lib/api/user";
import { createAgent, startAgent } from "@/lib/api/agent";
import { createRuntime, getRuntime } from "@/lib/api/runtime";


const MAX_FILE_SIZE = 5000000;
const formSchema = z.object({
  character: z
    .instanceof(File)
    .refine(file => file.size !== 0, "File may not be empty.")
    .refine(file => file.size < MAX_FILE_SIZE, "Max file size is 5MB."),
  env: z.string(),
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
      const character = await formData.character.text()
      const characterJson = JSON.parse(character) // TODO: catch SyntaxError
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
      const runtime = await createRuntime()
      toast({
        title: "Agent Created!",
        description: "Agent has been created, but is still waiting for the runtime to start.",
      })
      // wait for runtime to be up to start agent
      while (!runtime.started) {
        console.log(
          "Waiting for runtime",
          runtime.id,
          "at",
          runtime.url,
          "to instantiate",
        )
        const updatedRuntime = await getRuntime(
          runtime.id,
          30000, // 30 second delay
        )
        if (updatedRuntime.started) {
          console.log(runtime.id, "has successfully started!")
          break
        }
        toast({
          title: "Still waiting for runtime..."
        })
      }

      console.log("Attempting to start agent", agent.id, "on runtime", runtime.id)
      await startAgent(agent.id, runtime.id)

      toast({
        title: "Success!",
        description: "Character JSON loaded and Agent created.",
      })
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
          name="character"
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