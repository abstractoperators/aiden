import { Button } from "@/components/ui/button"

export default function Hero() {
  return (
    <section className="container flex flex-col items-center justify-center space-y-4 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
        Streamline Your Workflow
      </h1>
      <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
        Boost productivity and simplify your business processes with our intuitive SaaS platform.
      </p>
      <Button size="lg">Start Your Free Trial</Button>
    </section>
  )
}

