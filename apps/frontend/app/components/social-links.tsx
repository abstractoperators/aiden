import AbopIcon from "@/public/abstractoperators_favicon.jpg"
import DiscordIcon from "@/public/discord.svg"
import SeiIcon from "@/public/sei.svg"
import XIcon from "@/public/x.svg"
import Link from "next/link";
import Image from "next/image";

const socials = [
  {
    href: "https://x.com/aiden_agents",
    src: XIcon,
    alt: "X",
  },
  {
    href: "http://discord.gg/xYqe2JAu6K",
    src: DiscordIcon,
    alt: "Discord",
  },
  {
    href: "https://abop.ai/",
    src: AbopIcon,
    alt: "Abstract Operators",
  },
  {
    href: "https://www.sei.io/",
    src: SeiIcon,
    alt: "Sei",
  },
]

export function SocialLinks() {
  return (
    <nav className="flex items-center space-x-4">
      {socials.map(({ href, src, alt }) => (
        <Link
          key={href}
          href={href}
          className="text-gray-500 hover:text-gray-700"
          target="_blank"
        >
          <Image
            className="transition duration-300 w-6 rounded-full hover:invert-[.8] dark:invert dark:hover:invert-[.2]"
            src={src}
            alt={alt}
          />
          <span className="sr-only">{alt}</span>
        </Link>
      ))}
    </nav>
  )
} 