'use client'

import Link from 'next/link'
import LightGhost from '@/public/brand_assets/light-ghost.svg'
import DarkGhost from '@/public/brand_assets/dark-ghost.svg'
import ThemeImage from '@/components/ui/theme-image'
import { DynamicConnectButtonHeader } from './dynamic/connect-button'
import { ReactElement } from 'react'
import VisitorMenu from './visitor-menu'
import { useIsLoggedIn } from '@dynamic-labs/sdk-react-core'

const baseHeaderStyle = "sticky flex items-center justify-center top-0 z-50 w-full"
enum headerStyles {
  landing = `${baseHeaderStyle}`,
  main = `${baseHeaderStyle} bg-background/10 backdrop-blur`,
}

interface variantOutputs {
  headerStyle: headerStyles,
  aidenImage?: ReactElement,
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
        aidenImage: <ThemeImage
          className="w-6 transition duration-300 hover:invert-[.7]"
          lightSrc={LightGhost}
          darkSrc={DarkGhost}
          alt="AIDEN"
        />,
      }
  }
}

export default function Header({ variant }: variantProp) {
  const { headerStyle, aidenImage, } = getVariantOutputs(variant)
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
          {aidenImage}
        </Link>
        <nav className="flex items-center justify-between space-x-4 font-medium">
          <Link
            className="transition duration-300 hover:invert-[.5]"
            href='/agents'
          >
            Agents
          </Link>
          <div className="flex items-center justify-between space-x-2">
            <DynamicConnectButtonHeader
              width={4}
              height={2}
            />
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