'use client'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { EnvSchema } from "@/lib/schemas/environment-variables";
import { TokenSchema } from "@/lib/schemas/token";
import AgentBuilderSubmit, { agentBuilderOnSubmit } from "./submit";
import EnvironmentVariables from "./environment-variables";
import { CharacterSchema } from "@/lib/schemas/character";

const MAX_FILE_SIZE = 5000000;

const errorMap: z.ZodErrorMap = (issue, ctx) => {
  console.log(issue)
  const fieldName = issue.path.join('.')
  const fieldNameMessage = (str: string) => [fieldName, str].join(' ')
  switch (issue.code) {
    case "invalid_type":
      if (issue.received === "undefined") {
        return { message: fieldNameMessage("is missing from your JSON") }
      }
      if (issue.expected.includes('|')) {
        const formattedExpected = issue.expected.split('|').map(val => val.replaceAll('\'', '').trim()).join(', ')
        return { message: fieldNameMessage(`must be one of the following: ${formattedExpected}`) }
      }
      return { message: fieldNameMessage(`needs to be a ${issue.expected}, but is currently a ${issue.received}`) }
    case "invalid_enum_value":
      return { message: fieldNameMessage(`must be one of the following: ${issue.options.join(', ')}`)}
    case "unrecognized_keys":
      return { message: `${issue.keys.join(', ')} are not valid field(s)`}
    default:
      return { message: ctx.defaultError }
  }
}

const JsonAgentBuilderSchema = z.intersection(
  z.object({
    character: z
      .string()
      .min(1, "Cannot be empty")
      .transform((val, ctx) => {
        try {
          return JSON.parse(val)
        } catch (parseError) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${parseError}`,
          })
          return z.NEVER
        }
      })
      .transform((val, ctx) => {
        const parsed = CharacterSchema.safeParse(val, { errorMap })
        if (parsed.success) {
          return parsed.data
        }

        parsed.error.issues.forEach(issue => ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: issue.message,
        }))
        return z.NEVER
      }),
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
      )
      .optional(),
  }).merge(EnvSchema),
  TokenSchema,
)
type JsonAgentBuilderSchema = z.input<typeof JsonAgentBuilderSchema>
type JsonAgentBuilderOutputSchema = z.output<typeof JsonAgentBuilderSchema>

function JsonAgentBuilder({
  defaultValues,
  agentId,
}: {
  defaultValues?: JsonAgentBuilderSchema,
  agentId?: string,
}) {
  const { user, primaryWallet: wallet } = useDynamicContext()
  if (!user)
    throw new Error(`User ${user} does not exist!`)
  if (!user.userId)
    throw new Error(`User ${user} has no userId!`)

  const userId: string = user.userId

  const form = useForm<JsonAgentBuilderSchema, object, JsonAgentBuilderOutputSchema>({
    resolver: zodResolver(JsonAgentBuilderSchema),
    defaultValues: defaultValues ?? {
      character: "",
      env: [{ key: "", value: "", }],
      isNewToken: true,
      tokenName: "TEMPORARY",
      ticker: "HOLDER",
    },
  })
  const { handleSubmit, setValue, getValues } = form

  async function downloadCharacter() {
    const blob = new Blob([getValues("character")], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "character.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const { toast } = useToast()
  const { push } = useRouter()

  async function onSubmit(formData: JsonAgentBuilderOutputSchema) {
    console.debug("Agent Form Results", formData)
    const { character, env, isNewToken } = formData

    /** onSubmitCreate wraps the API creation of the agent.
     * It retrieves the API user ID and informs the user of success
     * before redirecting the user to the agent's profile page. */
    return agentBuilderOnSubmit(agentId)({
      dynamicId: userId,
      character,
      envFile: (
        env
        .filter(({value}) => value.length)
        .map(({key, value}) => `${key}=${value}`)
        .join('\n')
      ),
      token: isNewToken ? formData : formData.tokenId,
      push,
      wallet,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Accordion type="multiple" defaultValue={["file",]} className="space-y-2">
          <AccordionItem value="file">
            <AccordionTrigger className="font-semibold text-d6">
              Character JSON
            </AccordionTrigger>
            <AccordionContent>
              <FormField
                name="character"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel></FormLabel>
                    <FormControl>
                      <Textarea
                        rows={25}
                        placeholder="Paste your agent's Eliza Character JSON here!"
                        className={cn(
                          "w-full rounded-xl text-nowrap",
                          "border border-input bg-anakiwa-lighter dark:bg-anakiwa-darkest px-3 py-2",
                          "text-base shadow-sm placeholder:text-muted-foreground",
                          "disabled:opacity-50 md:text-sm resize-y",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between items-start">
                <FormField
                  name="characterFile"
                  render={({ field: { onChange, onBlur, disabled, name, ref } }) => (
                    <FormItem>
                      <FormLabel></FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".json,application/json"
                          onChange={async (event) => {
                            onChange(event.target.files && event.target.files[0])
                            const file = event.target.files?.[0]
                            if (!file) return

                            const fileText = await file.text().catch(error => {
                              toast({
                                title: "Unable to read JSON file; is it valid?",
                              });
                              console.error(error);
                              return
                            })

                            if (typeof(fileText) === "undefined")
                              return

                            setValue("character", fileText)
                          }}
                          {...{ onBlur, disabled, name, ref }}
                        />
                      </FormControl>
                      <FormDescription>
                        Upload a character JSON file.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  size="icon"
                  variant="default"
                  className="my-2 rounded-xl"
                  onClick={downloadCharacter} type="button"
                >
                  <Download />
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <EnvironmentVariables />

          {/* <TokenAccordion /> */}

        </Accordion>
        <AgentBuilderSubmit />
      </form>
    </Form>
  )
}

export default JsonAgentBuilder