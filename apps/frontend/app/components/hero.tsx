import LightGhost from "@/public/brand_assets/light-ghost.svg"
import Image from "next/image"

export default function Hero() {
  return (
    <section className="container flex flex-col items-center justify-center space-y-32 text-center">
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <Image
          className="w-1/2"
          src={LightGhost}
          alt="AIDEN"
        />
        <h1 className="text-3xl tracking-widest font-bold sm:text-4xl md:text-5xl lg:text-6xl">
          AIDEN
        </h1>
      </div>
      <div className="flex flex-col space-y-4 items-center justify-center">
        <h1 className="text-2xl tracking-wide font-bold sm:text-2xl md:text-3xl lg:text-4xl">
          High Performance Onchain Agents
        </h1>
      </div>
    </section>
  )
}