import ThemeImage from "./ui/theme-image"
import NewsletterSignup from "./newsletterSignup"
import BannerSky from "@/public/brand_assets/banner-sky.png"
import BannerOrbit from "@/public/brand_assets/banner-orbit.png"

export default function Hero() {
  return (
    <section className="container flex flex-col items-center justify-center space-y-8 text-center">
      <ThemeImage
        className="w-screen -mt-px"
        lightSrc={BannerSky}
        darkSrc={BannerOrbit}
        alt="Web3 &#129309; AI Agents"
      />
      {/* TODO: replace with proper modal integrating dynamic */}
      <NewsletterSignup size="lg">Reserve Your Username</NewsletterSignup>
    </section>
  )
}