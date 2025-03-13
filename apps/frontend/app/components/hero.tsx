import Logo from "@/public/brand_assets/dark-ghost.svg";
import Image from "next/image";
import Link from "next/link";
import { SocialLinks } from "./social-links";
import DynamicWaitlistButton from "./dynamic-waitlist-button";


export default function Hero() {
   return (
      <section className="container flex flex-col items-center justify-center space-y-4 text-center">
         <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <Image className="w-1/2" src={Logo} alt="AIDEN" />
            <h1 className="text-3xl tracking-widest font-bold sm:text-4xl md:text-5xl lg:text-6xl text-slate-800">AIDEN</h1>
         </div>
         <div className="flex flex-col space-y-4 items-center justify-center">
            <h2 className="text-2xl tracking-wide sm:text-2xl md:text-3xl lg:text-4xl text-slate-800">High Performance Onchain Agents</h2>
         </div>
         <div className="pb-16 pt-4">
            <SocialLinks />
         </div>
         <div className="flex justify-center items-center gap-8 m-8">
             <Link href="/agents">
            <button className="text-xl px-8 py-4 bg-slate-700 text-white rounded-lg hover:bg-gray-700 transition font-bold">Chat with an Agent</button>
            </Link>
            <button
               style={{
                  background: "radial-gradient(276.98% 284.46% at 25.31% 13.8%, rgba(213, 210, 255, .8) 0%, rgba(6, 109, 255, .8) 100%)",
               }}
               className="font-bold text-xl px-8 py-4 text-black rounded-lg transition hover:opacity-80"
            >
               Join the Waitlist
            </button>
         </div>
      </section>
   );
}
