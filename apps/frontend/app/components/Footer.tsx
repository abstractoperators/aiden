import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose md:text-left">© 2023 StreamLine. All rights reserved.</p>
        </div>
        <nav className="flex items-center space-x-4">
          <Link href="#" className="text-gray-500 hover:text-gray-700">
            <Facebook className="h-5 w-5" />
            <span className="sr-only">Facebook</span>
          </Link>
          <Link href="#" className="text-gray-500 hover:text-gray-700">
            <Twitter className="h-5 w-5" />
            <span className="sr-only">Twitter</span>
          </Link>
          <Link href="#" className="text-gray-500 hover:text-gray-700">
            <Instagram className="h-5 w-5" />
            <span className="sr-only">Instagram</span>
          </Link>
          <Link href="#" className="text-gray-500 hover:text-gray-700">
            <Linkedin className="h-5 w-5" />
            <span className="sr-only">LinkedIn</span>
          </Link>
        </nav>
      </div>
    </footer>
  )
}

