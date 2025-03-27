import LightLogo from "@/public/brand_assets/dark-ghost.svg"
import DarkLogo from "@/public/brand_assets/pink-ghost.svg"
import { DynamicConnectButtonHero } from "./dynamic/connect-button"
import ThemeImage from "./ui/theme-image"

export default function Hero() {
  return (
    <section className="container flex flex-col items-center justify-center space-y-8 text-center py-52">
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <ThemeImage
          priority={true}
          className="w-64"
          lightSrc={LightLogo}
          darkSrc={DarkLogo}
          alt="AIDEN"
        />
        <h1 className="tracking-widest font-bold sm:text-d3 md:text-d2 lg:text-d1">
          AIDEN
        </h1>
      </div>
      <div className="flex flex-col items-center justify-center space-y-8">
        <h2 className="tracking-wide sm:text-d4 md:text-d3 lg:text-d2">
          High Performance Onchain Agents
        </h2>
      </div>
      <DynamicConnectButtonHero
        width={8}
        textSize="3xl"
      />
    </section>
  )
}