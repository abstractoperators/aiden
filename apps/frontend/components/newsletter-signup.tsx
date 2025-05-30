"use client";

import { Button, ButtonProps } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email("Invalid email format"),
})
const publicationId = "pub_2bb6be72-86c2-4e64-a5c4-e6612a46fe37";
// TODO: move fetch on beehiv API to backend to keep token server-side. AKA this is bad security
const authHeader = "Bearer 7zepbrimwaZsOmr4INYfnsxi2N8SP3abW82xRjdia1CNNirg6F4kyCzFdsQBNQbP";
const url = `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`;

export default function NewsletterSignup(props: ButtonProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    }
  })

  async function onSubmit(formData: z.infer<typeof formSchema>) {
    try {
      const response = await fetch(
        url,
        {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type" : "application/json",
          },
          body: JSON.stringify({
            email : formData.email,
            reactivate_existing: true,
            send_welcome_email: true,
            utm_source: "aiden",
            utm_medium: "landingPage",
            utm_campaign: "feb_2025_pre_beta_campaign",
            referring_site: "aidn.fun",
            tier: "free",
          }),
        },
      );

      // Maybe more specific Error type
      if (!response.ok) throw new Error("Failed to submit form");

      toast({
        title: "Newsletter signup successful!",
        description: "Expect to hear from us soon :)",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Something went wrong. Please try again",
      });
      console.error(error);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button {...props}>{props.children}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Newsletter Signup</DialogTitle>
          <DialogDescription>
            Stay updated on our latest developments and be the first to hear about our releases!
            Sign up for our newsletter with your email.
          </DialogDescription>
        </DialogHeader>
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
                      placeholder="your@email.here"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Submit</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}