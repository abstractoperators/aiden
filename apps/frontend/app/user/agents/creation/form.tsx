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
import { toast } from "@/hooks/use-toast";
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
import { accordionItemStyle, EnvironmentVariables, envSchema, onSubmitBase, SubmitButton } from "@/components/agent-form";

const MAX_FILE_SIZE = 5000000;
const uploadSchema = z.object({
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
}).merge(envSchema)
type UploadType = z.infer<typeof uploadSchema>

function UploadForm() {
  const { user } = useDynamicContext()
  if (!user)
    throw new Error(`User ${user} does not exist!`)
  if (!user.userId)
    throw new Error(`User ${user} has no userId!`)

  const userId: string = user.userId

  const form = useForm<UploadType>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { env: "", },
  })
  const { handleSubmit } = form

  // TODO: set up sei and eth addresses if undefined

  async function onUploadSubmit(formData: UploadType) {
    console.debug("UploadForm", formData)
    const { env: envFile, characterFile } = formData

    const fileText = await characterFile.text().catch(error => {
      toast({
        title: "Unable to parse JSON file; is it valid?",
      });
      console.error(error);
      return undefined
    })

    if (typeof(fileText) === "undefined")
      return

    const characterJson = JSON.parse(fileText) // TODO: catch SyntaxError
    return onSubmitBase({ dynamicId: userId, characterJson, envFile })
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onUploadSubmit)} className="space-y-4">
        <Accordion type="multiple" className="space-y-2">
          <AccordionItem value="file" className={accordionItemStyle}>
            <AccordionTrigger className="font-semibold text-d6">
              Character JSON File
            </AccordionTrigger>
            <AccordionContent>
              <FormField
                name="characterFile"
                render={({ field: { onChange, onBlur, disabled, name, ref } }) => (
                  <FormItem>
                    <FormLabel></FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".json,application/json"
                        onChange={ event =>
                          onChange(event.target.files && event.target.files[0])
                        }
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
            </AccordionContent>
          </AccordionItem>

          <EnvironmentVariables />
        </Accordion>
        <SubmitButton />
      </form>
    </Form>
  )
}

export {
  UploadForm,
}