'use client'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDynamicContext, useUserWallets } from "@dynamic-labs/sdk-react-core"
import { dynamicToApiUser, getOrCreateUser } from "@/lib/api/user";
import { getEthSeiAddresses } from "@/lib/dynamic";
import { createAgent, startAgent } from "@/lib/api/agent";
import { createRuntime } from "@/lib/api/runtime";

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
  const { user } = useDynamicContext()
  const userWallets = useUserWallets()
  const { ethAddress, seiAddress } = getEthSeiAddresses(userWallets)
  // TODO: set up sei and eth addresses if undefined

  async function onSubmit(formData: z.infer<typeof formSchema>) {
    try {
      const character = await formData.character.text()
      const characterJson = JSON.parse(character) // TODO: catch SyntaxError
      console.debug(characterJson)

      const env = formData.env
      console.debug(".env", env)

      if (!ethAddress || !seiAddress) {
        console.debug("ETH address or SEI undefined:", ethAddress, seiAddress)
        console.debug("user:", user)
        console.debug("user wallets:", userWallets)
        throw new Error("ETH address or SEI undefined!")
      }

      const apiUser = await getOrCreateUser(dynamicToApiUser(
        ethAddress,
        seiAddress,
        user,
      ))

      const agentPayload = {
        owner_id: apiUser.id,
        character_json: characterJson,
        env_file: env,
      }

      const agent = await createAgent(agentPayload)
      // const runtime = await createRuntime()
      const RUNTIME_5_ID = "77343e55-c36c-4bcf-83f3-2841096007ae"
      await startAgent(agent.id, RUNTIME_5_ID)
      // await startAgent(agent.id, runtime.id)

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
          render={({ field: { value, onChange, ...fieldProps } }) => (
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