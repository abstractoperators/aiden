'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const menus = [
  { name: 'CREATE AGENT', href: '/user/agents/creation' },
  { name: 'AGENTS', href: '/agents' },
  { name: 'PROFILE', href: '/user/profile' },
]

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="w-full bg-[#121725] h-16 flex items-center justify-between px-8">
      {/* Left: Logo */}
      <Link href="/" className="flex items-center gap-3 select-none">
        <Image src="/brand_assets/blue-ghost.svg" alt="AIDN Logo" width={32} height={32} style={{ filter: 'brightness(0) invert(1)' }} />
        <span className="font-pixelcraft text-white text-2xl tracking-widest">AIDN</span>
      </Link>
      {/* Right: Menus */}
      <nav className="flex items-center gap-6">
        {menus.map(menu => {
          const isActive = pathname === menu.href || (menu.href === '/agents' && pathname.startsWith('/agents'));
          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={
                isActive
                  ? "font-sans uppercase text-white bg-[#121725] border-2 border-orange-400 rounded-lg px-4 py-1 text-base tracking-widest shadow font-bold"
                  : "font-sans uppercase text-gray-400 px-4 py-1 text-base tracking-widest hover:text-white transition"
              }
            >
              {menu.name}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}