import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FormCombobox } from "@/components/ui/combobox"
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { isSuccessResult } from "@/lib/api/result"
import { Token, getTokens } from "@/lib/api/token"
import { LaunchTokenSchema } from "@/lib/schemas/token"
import { capitalize, cn } from "@/lib/utils"
import { Link } from "lucide-react"
import { useState, useEffect } from "react"

function TokenAccordion() {
  return (
    <AccordionItem value="Token">
      <AccordionTrigger>Token</AccordionTrigger>
      <AccordionContent>
      {LaunchTokenSchema.keyof().options.map(name => (
        <FormField
          key={name}
          name={name}
          render={({ field }) => (
            <FormItem>
              <FormLabel></FormLabel>
              <FormControl>
                <Input
                  className="placeholder:text-neutral-400"
                  placeholder={capitalize(name)}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide a {name} for your agent&apos;s token.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
      </AccordionContent>
    </AccordionItem>
  )
}

function TokenComboboxAccordion() {
  const [tokens, setTokens] = useState<Token[]>([])
  useEffect(() => {
    getTokens().then(result => {
      if (isSuccessResult(result)) {
        setTokens(result.data)
      } else { toast({
        title: "Unable to fetch tokens!",
        description: result.message,
      })}
    })
  }, [])

  return (
    <AccordionItem value="Token">
      <AccordionTrigger>Token</AccordionTrigger>
      <AccordionContent>
        <FormField
          name="tokenId"
          render={({ field: { value, onChange } }) => (
            <FormItem>
              <FormLabel></FormLabel>
                <FormCombobox
                  value={value}
                  setValue={onChange}
                  instructions="Select a token..."
                  empty="No tokens found."
                  search="Search tokens..."
                  items={tokens.map(token => ({
                    label: `${token.name} ($${token.ticker})`,
                    value: token.id,
                  }))}
                />
              <FormDescription>
                Want more token details? Click&nbsp;
                <Link
                  href="/tokens"
                  className={cn(
                    "text-blue-600 underline text-sm mt-1",
                    "hover:text-blue-700 dark:hover:text-blue-500",
                    "transition duration-300",
                    "inline-block",
                  )}
                >
                  here
                </Link>
                .
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </AccordionContent>
    </AccordionItem>
  )
}

export {
  TokenAccordion,
  TokenComboboxAccordion,
}