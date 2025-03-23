import Logo from "@/public/brand_assets/dark-ghost.svg"
import Image from "next/image"
import Link from "next/link"
import { Button } from "./ui/button"
import DynamicWaitlistButton from "./dynamic-waitlist-button"

export default function Hero() {
  return (
    <section className="container flex flex-col items-center justify-center space-y-32 text-center">
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <Image
          priority={true}
          className="w-1/2"
          src={Logo}
          alt="AIDEN"
        />
        <h1 className="text-3xl tracking-widest font-bold sm:text-4xl md:text-5xl lg:text-6xl text-neutral-800">
          AIDEN
        </h1>
      </div>
      <div className="flex flex-col space-y-4 items-center justify-center">
        <h1 className="text-2xl tracking-wide sm:text-2xl md:text-3xl lg:text-4xl text-neutral-800">
          High Performance Onchain Agents
        </h1>
      </div>
      <div className="flex justify-center items-center gap-8 m-8">
        <Button
          className="text-xl px-8 py-8 bg-anakiwa-darker dark:bg-anakiwa-darker hover:bg-anakiwa-dark dark:hover:bg-anakiwa text-white dark:hover:text-black rounded-lg transition font-bold"
          asChild
        >
          <Link href="/agents">
            Chat with an Agent
          </Link>
        </Button>
        <DynamicWaitlistButton
          width={8}
          height={8}
          connectHeight={5}
          textSize="xl"
        >
          Join the Waitlist
        </DynamicWaitlistButton>
      </div>
    </section>
  )
}