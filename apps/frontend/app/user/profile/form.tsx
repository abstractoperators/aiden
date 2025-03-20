'use client'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

const formSchema = z.object({
  email: z
    .string()
    .email("Invalid email format.")
    .or(z.literal("")),
  username: z
    .string()
    .max(32, "Username may not exceed 32 characters in length.")
    .regex(/^(?!\.).*(?<!\.)$/, "Username may not start or end with a period.")
    .regex(/^(?!.*\.\.).*$/, "Username may not contain consecutive periods.")
    .regex(/^[A-Za-z0-9_.]*$/, "Username may only contain letters, numbers, underscores, and periods."),
  phoneNumber: z
    .string()
    .max(15), // TODO: use https://github.com/google/libphonenumber
})

export default function ProfileForm() {
  const { user } = useDynamicContext()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      username: "",
      phoneNumber: "",
    }
  })

  async function onSubmit(formData: z.infer<typeof formSchema>) {
    try {
      // TODO: Send form to backend
      console.log(formData.email)

      toast({
        title: "Profile successfully updated!",
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder={user?.email}
                  defaultValue={user?.email}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  placeholder={user?.username ?? undefined}
                  defaultValue={user?.username ?? undefined}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input
                  placeholder={user?.phoneNumber}
                  defaultValue={user?.phoneNumber}
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