"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { capitalize } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { isErrorResult } from "@/lib/api/result";
import { toast } from "@/hooks/use-toast";
import { launchTokenFactory } from "@/lib/contracts/bonding";
import { LaunchTokenSchema } from "@/lib/schemas/token";

export default function TokenForm() {
  const { primaryWallet: wallet } = useDynamicContext();
  const { push } = useRouter()

  const form = useForm<LaunchTokenSchema>({
    resolver: zodResolver(LaunchTokenSchema),
    defaultValues: {
      tokenName: "",
      ticker: "",
    }
  })
  const { handleSubmit } = form

  const onSubmit = async (formData: LaunchTokenSchema) => {
    const { tokenName: name, ticker } = formData
    try {
      const result = await launchTokenFactory(wallet)(formData)
      if (isErrorResult(result)) {
        toast({
          title: `Unable to save token ${name} ($${ticker})`,
          description: result.message,
        })
      } else {
        toast({
          title: `Token ${name} ($${ticker}) created!`
        })
        push(`/tokens/${result.data.id}`)
      }
    } catch (error) {
      console.error(`An error occurred while launching token ${formData}: ${error}`)
      toast({
        title: `Unable to launch token ${name} ($${ticker})`,
        description: `${error}`,
      })
    }
  }
  
  if (!wallet || !isEthereumWallet(wallet))
    return (<>Please sign into an Ethereum wallet.</>);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {[ "name", "ticker" ].map(name => (
          <FormField
            key={name}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel></FormLabel>
                <FormControl>
                  <Input
                    className="placeholder:text-neutral-500"
                    placeholder={capitalize(name)}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        ))}
        <Button type="submit">Launch Token</Button>
      </form>
    </Form>
  )
};