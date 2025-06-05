import LightLogo from "@/public/brand_assets/blue-ghost.svg"
import DarkLogo from "@/public/brand_assets/pink-ghost.svg"
import { LoginButtonHero } from "./dynamic/login-button"
import ThemeImage from "./ui/theme-image"
import { ChevronsDown } from "lucide-react"
import Link from "next/link"
import { buttonVariants } from "./ui/button"
import { cn } from "@/lib/utils"

export default function Hero() {
  return (
    <section id="hero" className="container flex flex-col items-center justify-center gap-8 text-center py-32">
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <ThemeImage
          priority={true}
          className="w-64"
          lightSrc={LightLogo}
          darkSrc={DarkLogo}
          alt="AIDN"
        />
        <h1 className="tracking-widest font-bold sm:text-d3 md:text-d2 lg:text-d1">
          AIDN
        </h1>
      </div>
      <div className="flex flex-col items-center justify-center gap-8">
        <h2 className="tracking-wide sm:text-d4 md:text-d3 lg:text-d2">
          High Performance Onchain AI Agents
        </h2>
      </div>
      <div className="h-48 flex flex-col items-center justify-between">
        <LoginButtonHero className="px-8 py-8 text-3xl" />
          <Link
            href="#about"
            className={cn(
              buttonVariants({
                variant: "ghost",
              }),
              "rounded-xl h-12 w-12",
            )}
          >
            <ChevronsDown
              className="animate-bounce mt-2 !h-8 !w-8"
              strokeWidth={3}
            />
            <span className="sr-only">Scroll Down</span>
          </Link>
      </div>
    </section>
  )
}