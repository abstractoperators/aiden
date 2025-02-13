import NewsletterSignup from "./newsletterSignup"

export default function Hero() {
  return (
    <section className="container flex flex-col items-center justify-center space-y-4 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
        Web3 &#129309; AI Agents
      </h1>
      <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
        Why have one when you can have both???
      </p>
      <NewsletterSignup size="lg">Sign Up</NewsletterSignup>
    </section>
  )
}