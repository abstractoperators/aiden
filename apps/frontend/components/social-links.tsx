import DiscordIcon from "@/public/discord.svg"
import SeiIcon from "@/public/sei.svg"
import XIcon from "@/public/x.svg"
import Link from "next/link";
import Image from "next/image";

const socials = [
  {
    href: "https://x.com/aidn_fun",
    src: XIcon,
    alt: "X",
  },
  {
    href: "http://discord.gg/xYqe2JAu6K",
    src: DiscordIcon,
    alt: "Discord",
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
          className=""
          target="_blank"
        >
          <Image
            className="transition duration-300 w-6 rounded-full filter invert"
            src={src}
            alt={alt}
          />
          <span className="sr-only">{alt}</span>
        </Link>
      ))}
    </nav>
  )
} 