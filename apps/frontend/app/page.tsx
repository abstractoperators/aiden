'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SocialLinks } from '@/components/social-links';
import { LoginButtonHeader } from '@/components/dynamic/login-button';
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { useIsLoggedIn } from '@dynamic-labs/sdk-react-core'
import { Button } from '@/components/ui/button';

export default function Home() {
  const isLoggedIn = useIsLoggedIn();
  const { setShowAuthFlow } = useDynamicContext();
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#181C23] text-white font-mono bg-cover bg-center" style={{ backgroundImage: "url('/background.png')" }}>
      {/* Top Bar */}
      <header className="flex justify-between items-center px-8 py-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand_assets/blue-ghost.svg" alt="AIDN Logo" width={48} height={48} style={{ filter: 'brightness(0) invert(1)' }} />
          <span className="font-bold text-4xl tracking-widest font-sans">AIDN</span>
        </Link>
        {/* Nav */}
        <nav className="flex items-center gap-8 text-sm font-bold font-sans">
          <Link href="/agents" className="hover:text-orange-400 transition font-pixelcraft">AGENTS</Link>
          <LoginButtonHeader className="px-4 py-2" />
          {/* {
            !isLoggedIn &&
            <VisitorMenu />
          } */}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center flex-1 text-center">
        <div className="flex flex-col items-center gap-8">
          <Image src="/brand_assets/blue-ghost.svg" alt="AIDN Logo Large" width={120} height={120} style={{ filter: 'brightness(0) invert(1)' }} />
          <h1 className="text-4xl md:text-5xl font-bold tracking-widest mt-2 font-pixelcraft">AIDN</h1>
          <h2 className="text-lg md:text-xl font-bold tracking-widest text-gray-300 mb-2 font-pixelcraft">HIGH PERFORMANCE ONCHAIN AI AGENTS</h2>
          { !isLoggedIn && <button
            onClick={() => setShowAuthFlow(true)}
            className="group inline-flex items-center justify-center px-5 py-1.5 border-2 border-orange-400 rounded-2xl bg-[#111522] font-pixelcraft text-white text-base md:text-lg tracking-widest font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white hover:border-white hover:text-white"
            style={{ letterSpacing: '0.08em' }}
          >
            <span className="text-left">REGISTER</span>
            <span className="ml-3 flex items-center justify-center w-8 h-8 bg-orange-400 rounded-lg transition-colors duration-200 group-hover:bg-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </span>
          </button>}
          { isLoggedIn && <Link
            href="/user/agents/creation"
            className="group inline-flex items-center justify-center px-5 py-1.5 border-2 border-orange-400 rounded-2xl bg-[#111522] font-pixelcraft text-white text-base md:text-lg tracking-widest font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white hover:border-white hover:text-white"
            style={{ letterSpacing: '0.08em' }}
          >
            <span className="text-left">CREATE AN AGENT</span>
            <span className="ml-3 flex items-center justify-center w-8 h-8 bg-orange-400 rounded-lg transition-colors duration-200 group-hover:bg-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </span>
          </Link>}
        </div>
      </main>

      {/* Social Links */}
      <footer className="flex justify-center pb-8">
        <div className="bg-[#181C23] rounded-full px-6 py-2 flex gap-6 border border-[#23272F] shadow-lg">
          <SocialLinks />
        </div>
      </footer>
    </div>
  );
}

