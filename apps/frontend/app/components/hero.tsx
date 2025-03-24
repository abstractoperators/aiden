import Logo from "@/public/brand_assets/dark-ghost.svg"
import Image from "next/image"
import Link from "next/link"
import { Button } from "./ui/button"
import DynamicWaitlistButton from "./dynamic-waitlist-button"

export default function Hero() {
  return (
    <section className="container flex flex-col items-center justify-center space-y-8 text-center">
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <Image
          priority={true}
          className="w-1/2"
          src={Logo}
          alt="AIDEN"
        />
        <h1 className="tracking-widest font-bold sm:text-d3 md:text-d2 lg:text-d1 text-neutral-800">
          AIDEN
        </h1>
      </div>
      <div className="flex flex-col items-center justify-center space-y-8">
        <h2 className="tracking-wide sm:text-d4 md:text-d3 lg:text-d2 text-neutral-800">
          High Performance Onchain Agents
        </h2>
      </div>
      <div className="flex justify-center items-center gap-8 m-8">
        <Button
          className="text-xl px-8 py-8 bg-anakiwa-darker dark:bg-anakiwa-darker hover:bg-anakiwa-dark dark:hover:bg-anakiwa text-white dark:hover:text-black rounded-lg transition duration-300 font-bold"
          asChild
        >
          <Link href="/agents">
            Chat with an Agent
          </Link>
        </Button>
        <DynamicWaitlistButton
          width={8}
          height={8}
          textSize="xl"
        >
          Join the Waitlist
        </DynamicWaitlistButton>
      </div>
    </section>
  )
}