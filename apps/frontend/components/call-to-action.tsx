import { Button } from "@/components/ui/button"

export default function CTA() {
  return (
    <section className="bg-primary py-24">
      <div className="container flex flex-col items-center space-y-4 text-center text-primary-foreground">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Ready to Streamline Your Workflow?</h2>
        <p className="mx-auto max-w-[700px] text-primary-foreground/80 md:text-xl">
          Join thousands of satisfied customers and start optimizing your business processes today.
        </p>
        <Button size="lg" variant="secondary">
          Start Your Free Trial
        </Button>
      </div>
    </section>
  )
}

