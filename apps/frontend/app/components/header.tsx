'use client'

import Link from 'next/link'
import { DarkModeToggle } from './dark-mode-toggle'
import LightGhost from '@/public/brand_assets/light-ghost.svg'
import DarkGhost from '@/public/brand_assets/dark-ghost.svg'
import ThemeImage from '@/components/ui/theme-image'
import DynamicWaitlistButton from './dynamic-waitlist-button'
import Image from 'next/image'
import { ReactElement } from 'react'

const baseHeaderStyle = "sticky flex items-center justify-center top-0 z-50 w-full {}"
enum headerStyles {
  landing = `${baseHeaderStyle}`,
  main = `${baseHeaderStyle} bg-background/10 backdrop-blur supports-[backdrop-filter]:bg-background/10`,
}

interface variantOutputs {
  headerStyle: headerStyles,
  aidenImage: ReactElement,
}
interface variantProp {
  variant?: "landing" | "main",
}
function getVariantOutputs(variant: variantProp["variant"]): variantOutputs {
  switch (variant) {
    case "landing":
      return {
        headerStyle: headerStyles.landing,
        aidenImage: <Image
          className="w-6 transition duration-300 hover:invert-[.5]"
          src={LightGhost}
          alt="AIDEN"
        />,
      }
    case "main":
    default:
      return {
        headerStyle: headerStyles.main,
        aidenImage: <ThemeImage
          className="w-6 transition duration-300 hover:invert-[.5]"
          lightSrc={LightGhost}
          darkSrc={DarkGhost}
          alt="AIDEN"
        />,
      }
  }
}

export default function Header({ variant }: variantProp) {
  const { headerStyle, aidenImage, } = getVariantOutputs(variant)

  return (
    <header
      className={headerStyle}
    >
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link
            href="/"
            className="mr-6 flex items-center space-x-2"
          >
            {aidenImage}
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              className="transition duration-300 hover:invert-[.5]"
              href='/agents'
            >
              Agents
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <DynamicWaitlistButton cta="Join the Waitlist" />
          <DarkModeToggle />
        </div>
      </div>
    </header>
  )
}