import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  FormField,
  FormItem,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useFieldArray } from "react-hook-form"

const envTitles = {
  "key": "Key",
  "value": "Value",
}

export default function EnvironmentVariables() {
  const name = "env"
  const title = "Environment Variables"
  const { fields, append, remove } = useFieldArray({
    name,
  })

  return (
    <AccordionItem value="Environment Variables">
      <AccordionTrigger>
        Environment Variables
      </AccordionTrigger>
      <AccordionContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-x-4 gap-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-4 items-center">
            <div className="flex gap-2 items-center">
            {Object.entries(envTitles).map(([fieldName, title], entryIndex) => (
              <div key={`envFormField.${entryIndex}`} className="flex gap-2 items-center">
                <FormField
                  key={`${name}.${index}.${fieldName}`}
                  name={`${name}.${index}.${fieldName}`}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          className="placeholder:text-neutral-400"
                          placeholder={title}
                          {...formField}
                        />
                      </FormControl>
                      <FormDescription />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {entryIndex < Object.entries(envTitles).length - 1 && <div>=</div>}
              </div>
            ))}
            </div>
            <Button type="button" variant="destructive" onClick={() => remove(index)}>
              Remove
            </Button>
          </div>
        ))}
        </div>
        <Button type="button" onClick={() => append([{ key: "", value: "" }])}>Add {title}</Button>
      </AccordionContent>
    </AccordionItem>
  )
}
