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
import {
  EnvironmentVariables,
  envSchema,
  onSubmitCreate,
  onSubmitEdit,
  SubmitButton,
  // TokenAccordion,
  tokenSchema,
} from "@/components/agent-form";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const MAX_FILE_SIZE = 5000000;
const agentSchema = z.intersection(
  z.object({
    character: z
      .string()
      .min(1, "Cannot be empty")
      .refine(
        val => {
          try {
            JSON.parse(val)
            return true
          } catch {
            return false
          }
        },
        { message: "Must be valid JSON" },
      ),
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
  }).merge(envSchema),
  tokenSchema,
)
type AgentSchema = z.infer<typeof agentSchema>

function UploadForm({
  defaultValues,
  agentId,
}: {
  defaultValues?: AgentSchema,
  agentId?: string,
}) {
  const { user, primaryWallet: wallet } = useDynamicContext()
  
  // Add loading state and proper error handling
  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">Loading user data...</div>
      </div>
    )
  }
  
  if (!user.userId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">User not properly authenticated. Please log in again.</div>
      </div>
    )
  }

  const userId: string = user.userId

  const form = useForm<AgentSchema>({
    resolver: zodResolver(agentSchema),
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

  const onSubmitBase = agentId ? onSubmitEdit(agentId) : onSubmitCreate

  async function onSubmit(formData: AgentSchema) {
    console.debug("Agent Form Results", formData)
    const { character, env, isNewToken } = formData

    /** onSubmitCreate wraps the API creation of the agent.
     * It retrieves the API user ID and informs the user of success
     * before redirecting the user to the agent's profile page. */
    return onSubmitBase({
      dynamicId: userId,
      character: JSON.parse(character),
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
            <AccordionTrigger className="font-semibold text-d6 text-white">
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
                        rows={40}
                        placeholder="Paste your agent's Eliza Character JSON here!"
                        className={cn(
                          "w-full rounded-xl text-nowrap",
                          "border bg-panel px-3 py-2",
                          "text-base shadow-sm placeholder:text-gray-400 text-white",
                          "disabled:opacity-50 md:text-sm resize-none",
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
                          className="text-white"
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
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadCharacter}
                  className="text-white mt-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <Accordion type="multiple" className="space-y-2">
          <EnvironmentVariables />
        </Accordion>
        
        <div className="flex justify-center pt-4">
          <SubmitButton />
        </div>
      </form>
    </Form>
  )
}

export default UploadForm