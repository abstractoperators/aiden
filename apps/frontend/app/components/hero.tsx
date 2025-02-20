import NewsletterSignup from "./newsletter-signup"

export default function Hero() {
  return (
    <section className="container flex flex-col items-center justify-center space-y-8 text-center">
      {/* TODO: replace with proper modal integrating dynamic */}
      <NewsletterSignup size="lg">Reserve Your Username</NewsletterSignup>
    </section>
  )
}