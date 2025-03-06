'use client'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { promises as fs } from "fs";
import { Button } from "@/components/ui/button";

const MAX_FILE_SIZE = 5000000;
const formSchema = z.object({
  file: z
    .instanceof(File)
    .refine(file => file.size !== 0, "File may not be empty.")
    .refine(file => file.size < MAX_FILE_SIZE, "Max file size is 5MB."),
})

export default function FileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  async function onSubmit(formData: z.infer<typeof formSchema>) {
    try {
      const file = await formData.file.text()
      const character = JSON.parse(file) // TODO: catch SyntaxError
      console.log(character)

      const response = await fetch(
        new URL('agents', process.env.API_ENDPOINT),
        {
          method: 'POST',
        }
      )

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
          name="file"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Character JSON File</FormLabel>
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
        <Button type="submit">Submit</Button>
    </form>
    </Form>
  )
}