'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LoginButtonHeader } from '@/components/dynamic/login-button';
import { useIsLoggedIn } from '@dynamic-labs/sdk-react-core'

const menus = [
  { name: 'CREATE AGENT', href: '/user/agents/creation', isLoggedIn: true },
  { name: 'AGENTS', href: '/agents', isLoggedIn: false },
]

export default function Header() {
  const isLoggedIn = useIsLoggedIn();
  const pathname = usePathname();

  return (
    <header className="w-full bg-panel h-16 flex items-center justify-between px-8">
      {/* Left: Logo */}
      <Link href="/" className="flex items-center gap-3 select-none">
        <Image src="/brand_assets/blue-ghost.svg" alt="AIDN Logo" width={32} height={32} style={{ filter: 'brightness(0) invert(1)' }} />
        <span className="font-pixelcraft text-white text-2xl tracking-widest">AIDN</span>
      </Link>
      {/* Right: Menus */}
      <nav className="flex items-center gap-6">
        {menus.map(menu => {
          // Skip rendering if menu requires login but user is not logged in
          if (menu.isLoggedIn && !isLoggedIn) {
            return null;
          }
          
          const isActive = pathname === menu.href || (menu.href === '/agents' && pathname.startsWith('/agents'));
          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={
                isActive
                  ? "font-pixelcraft uppercase hover:text-anakiwa text-white bg-panel border-2 border-anakiwa rounded-lg px-4 py-1 text-base tracking-widest shadow font-bold"
                  : "font-pixelcraft uppercase hover:text-anakiwa text-gray-400 px-4 py-1 text-base tracking-widest hover:text-white transition"
              }
            >
              {menu.name}
            </Link>
          )
        })}
        <LoginButtonHeader className="px-4 py-2" />
      </nav>
    </header>
  )
}