'use client'

import Link from 'next/link'
import LightGhost from '@/public/brand_assets/light-ghost.svg'
import DarkGhost from '@/public/brand_assets/dark-ghost.svg'
import ThemeImage from '@/components/ui/theme-image'
import { LoginButtonHeader } from './dynamic/login-button'
import { ReactElement } from 'react'
import VisitorMenu from './visitor-menu'
import { useIsLoggedIn } from '@dynamic-labs/sdk-react-core'

const baseHeaderStyle = "sticky flex items-center justify-center top-0 z-50 w-full"
enum headerStyles {
  landing = baseHeaderStyle,
  main = `${baseHeaderStyle} bg-background/10 backdrop-blur`,
}

interface variantOutputs {
  headerStyle: headerStyles,
  aidnImage?: ReactElement,
}
interface variantProp {
  variant?: "landing" | "main",
}
function getVariantOutputs(variant: variantProp["variant"]): variantOutputs {
  switch (variant) {
    case "landing":
      return {
        headerStyle: headerStyles.landing,
      }
    case "main":
    default:
      return {
        headerStyle: headerStyles.main,
        aidnImage: <ThemeImage
          className="w-6 transition duration-300 hover:invert-[.7]"
          lightSrc={LightGhost}
          darkSrc={DarkGhost}
          alt="AIDN"
        />,
      }
  }
}

export default function Header({ variant }: variantProp) {
  const { headerStyle, aidnImage, } = getVariantOutputs(variant)
  const isLoggedIn = useIsLoggedIn();

  return (
    <header
      className={headerStyle}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="mr-6 flex items-center space-x-2"
        >
          {aidnImage}
        </Link>
        <nav className="flex items-center justify-between space-x-4 font-medium">
          <Link
            className="transition duration-300 hover:invert-[.5]"
            href='/agents'
          >
            Agents
          </Link>
          {/* <Link
            className="transition duration-300 hover:invert-[.5]"
            href='/tokens'
          >
            Tokens
          </Link> */}
          <div className="flex items-center justify-between space-x-2">
            <LoginButtonHeader className="px-4 py-2" />
            {
              !isLoggedIn &&
              <VisitorMenu />
            }
          </div>
        </nav>
      </div>
    </header>
  )
}