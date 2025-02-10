import Link from "next/link"
import NewsletterSignup from "@/components/ui/newsletterSignup";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">AIDEN</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="#about">About Us</Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <NewsletterSignup className="hidden md:inline-flex">
              Join Our Newsletter
            </NewsletterSignup>
          </div>
        </div>
      </div>
    </header>
  )
}