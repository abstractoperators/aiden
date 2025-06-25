import Image from 'next/image';
import Link from 'next/link';
import { SocialLinks } from '@/components/social-links';

export default function Home() {
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
        <nav className="flex gap-8 text-sm font-bold font-sans">
          <Link href="/signup" className="hover:text-orange-400 transition">REGISTER</Link>
          <Link href="/agents" className="hover:text-orange-400 transition">AGENTS</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center flex-1 text-center">
        <div className="flex flex-col items-center gap-8">
          <Image src="/brand_assets/blue-ghost.svg" alt="AIDN Logo Large" width={120} height={120} style={{ filter: 'brightness(0) invert(1)' }} />
          <h1 className="text-4xl md:text-5xl font-bold tracking-widest mt-2 font-pixelcraft">AIDN</h1>
          <h2 className="text-lg md:text-xl font-bold tracking-widest text-gray-300 mb-2 font-pixelcraft">HIGH PERFORMANCE ONCHAIN AI AGENTS</h2>
          <Link href="/signup" className="inline-flex items-center justify-center px-8 py-2 border border-orange-400 text-orange-400 font-bold rounded transition hover:bg-orange-400 hover:text-black font-sans">
            REGISTER <span className="ml-2">→</span>
          </Link>
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

