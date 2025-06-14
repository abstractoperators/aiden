import Link from "next/link"

const linkClassName = "text-anakiwa-lighter hover:text-white dark:text-carnation-light dark:hover:text-carnation-dark"

export default function About() {
  return (
    <section id="about" className="container flex flex-col items-center justify-center space-y-16 py-72">
      <h1 className="text-4xl tracking-widest font-bold sm:text-5xl md:text-6xl lg:text-7xl text-center">
        ABOUT US
      </h1>
      <p className="text-sm sm:text-base md:text-lg lg:text-xl m-auto max-w-[1000px]">
        Developed by <Link className={linkClassName} href="https://abop.ai/" target="_blank">
          Abstract Operators
        </Link> and powered by <Link className={linkClassName} href="https://www.sei.io/" target="_blank">
          Sei
        </Link>, AIDN ([A]gent [I]ntegration & [D]eployment E[N]gine) is an AI Agent Platform
        for users to create, integrate, interact with, and deploy a diverse ecosystem
        of High Performance AI Agents with no-code/low-code UI/UX on the Sei blockchain - 
        a world scale EVM Layer-1 blockchain.
      </p>
    </section>
  )
}