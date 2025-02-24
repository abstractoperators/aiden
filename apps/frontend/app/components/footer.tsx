import Link from "next/link"
import AbopIcon from "@/public/abstractoperators_favicon.jpg"
import Image from "next/image"
import SeiIcon from "@/public/sei-favicon.png"
import { Twitter } from "lucide-react"

const baseFooterStyle = "w-full flex justify-center"
enum footerStyles {
  landing = `${baseFooterStyle}`,
  main = `${baseFooterStyle} bg-background/10 backdrop-blur supports-[backdrop-filter]:bg-background/10`
}

interface variantOutputs {
  footerStyle: footerStyles,
}
interface variantProp {
  variant?: "landing" | "main",
}
function getVariantOutputs(variant: variantProp["variant"]): variantOutputs {
  switch (variant) {
    case "landing":
      return {
        footerStyle: footerStyles.landing,
      }
    case "main":
    default:
      return {
        footerStyle: footerStyles.main,
      }
  }
}

export default function Footer({ variant }: variantProp) {
  const { footerStyle, } = getVariantOutputs(variant)

  return (
    <footer className={footerStyle}>
      <div className="container flex flex-col items-center justify-between text-sm gap-4 py-10 md:flex-row md:py-4">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center leading-loose md:text-left">
            © 2025 AIDEN. All rights reserved.
          </p>
        </div>
        <nav className="flex items-center space-x-4">
          <Link
            href="/about"
            className="transition duration-300 hover:invert-[.5]"
          >
            About Us
          </Link>
          <Link
            href="https://x.com/aiden_agents"
            className="transition duration-300 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            target="_blank"
          >
            <Twitter
              size={28}
              strokeWidth={2.5}
            />
          </Link>
          <Link
            href="https://abop.ai/"
            className="text-gray-500 hover:text-gray-700"
            target="_blank"
          >
            <Image
              className="transition duration-300 w-6 rounded-full hover:invert-[.8] dark:invert dark:hover:invert-[.2]"
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
              className="transition duration-300 w-6 rounded-full hover:invert-[.5]"
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

