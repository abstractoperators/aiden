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
import { useEffect } from "react";
import { EnvSchema } from "@/lib/schemas/environment-variables";
import { TokenSchema } from "@/lib/schemas/token";
import AgentBuilderSubmit, { agentBuilderOnSubmit } from "./submit";
import EnvironmentVariables from "./environment-variables";
import { Character, CharacterSchema, ModelProviderName } from "@/lib/schemas/character";
import { TokenAccordion } from "./token";

const MAX_FILE_SIZE = 5000000;

const defaultCharacter: Character = {
  name: "",
  clients: [],
  modelProvider: ModelProviderName.OPENAI,
  plugins: [],
  bio: [],
  lore: [],
  messageExamples: [],
  postExamples: [],
  adjectives: [],
  topics: [],
  style: {
    all: [],
    chat: [],
    post: [],
  },
}

const errorMap: z.ZodErrorMap = (issue, ctx) => {
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
type JsonAgentBuilderInputSchema = z.input<typeof JsonAgentBuilderSchema>
type JsonAgentBuilderOutputSchema = z.output<typeof JsonAgentBuilderSchema>

function JsonAgentBuilder({
  defaultValues,
  agentId,
  onDataUpdate,
}: {
  defaultValues?: JsonAgentBuilderInputSchema,
  agentId?: string,
  onDataUpdate?: (data: any) => void,
}) {
  const { user, primaryWallet: wallet } = useDynamicContext()

  const form = useForm<JsonAgentBuilderInputSchema, object, JsonAgentBuilderOutputSchema>({
    resolver: zodResolver(JsonAgentBuilderSchema),
    defaultValues: defaultValues ?? {
      character: JSON.stringify(defaultCharacter, null, 4),
      env: [{ key: "", value: "", }],
      isNewToken: true,
      tokenName: "",
      ticker: "",
    },
  })
  const { handleSubmit, setValue, getValues, formState, watch } = form

  const { toast } = useToast()
  const { push } = useRouter()

  // // Watch form changes and update parent component
  // const watchedValues = watch();
  // useEffect(() => {
  //   if (onDataUpdate && watchedValues) {
  //     onDataUpdate(watchedValues);
  //   }
  // }, [watchedValues, onDataUpdate]);

  // Add loading state and proper error handling
  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-foreground">Loading user data...</div>
      </div>
    )
  }
  
  if (!user.userId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-foreground">User not properly authenticated. Please log in again.</div>
      </div>
    )
  }

  const userId: string = user.userId

  async function downloadCharacter() {
    const blob = new Blob([getValues("character")], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "character.json"
    link.click()
    URL.revokeObjectURL(url)
  }

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
            <AccordionTrigger className="font-semibold text-d6 text-foreground">
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
                          "border bg-panel px-3 py-2",
                          "text-base shadow-sm placeholder:text-gray-400 text-foreground",
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
                          className="text-foreground"
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
                      <FormDescription className="text-gray-300">
                        Upload a character JSON file.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadCharacter}
                  className="text-foreground mt-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          <EnvironmentVariables />
          { !agentId && <TokenAccordion />}
        </Accordion>
        <AgentBuilderSubmit
          // not sure why we can't unpack formState here, so we have to pass each individual property
          isSubmitting={formState.isSubmitting}
          isSubmitSuccessful={formState.isSubmitSuccessful}
        />
      </form>
    </Form>
  )
}

export default JsonAgentBuilder