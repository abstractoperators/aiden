import Footer from "@/components/footer"
import Header from "@/components/header"
import { SocialLinks } from "@/components/social-links"

export default function CheckBackLater() {
  return <div className="flex flex-col justify-between items-center w-full min-h-screen">
    <Header />
    <main className="flex-1 flex flex-col justify-center items-center text-center gap-8">
      <h1>You&apos;ve signed up! Check your email for any updates.</h1>
      <h3 className="text-d4">In the meantime, follow us on our socials down below!</h3>
      <SocialLinks />
    </main>
    <Footer />
  </div>
}