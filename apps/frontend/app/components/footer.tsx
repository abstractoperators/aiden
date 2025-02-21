import Link from "next/link"
import AbopIcon from "@/public/abstractoperators_favicon.jpg"
import Image from "next/image"
import SeiIcon from "@/public/sei-favicon.png"
import { Twitter } from "lucide-react"

export default function Footer() {
  return (
    <footer className="w-full flex justify-center bg-background/10 backdrop-blur supports-[backdrop-filter]:bg-background/10">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose md:text-left">
            © 2025 AIDEN. All rights reserved.
          </p>
        </div>
        <nav className="flex items-center space-x-4">
          <Link
            href="https://x.com/aiden_agents"
            className="text-gray-500 hover:text-gray-700"
            target="_blank"
          >
            <Twitter size={28} strokeWidth={2.5} />
          </Link>
          <Link
            href="https://abop.ai/"
            className="text-gray-500 hover:text-gray-700"
            target="_blank"
          >
            <Image
              className="w-6 rounded-full transition-[color,drop-shadow] hover:bg-destructive/90"
              src={AbopIcon}
              alt="Abop"
            />
            <span className="sr-only">Abstract Operators</span>
          </Link>
          <Link
            href="https://www.sei.io/"
            className="text-gray-500 hover:text-gray-700"
            target="_blank"
          >
            <Image
              className="w-6 rounded-full transition-[color,drop-shadow] hover:bg-primary/20"
              src={SeiIcon}
              alt="Sei"
            />
            <span className="sr-only">Sei</span>
          </Link>
        </nav>
      </div>
    </footer>
  )
}

