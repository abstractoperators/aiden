"use client";

import Link from "next/link"
// import { DynamicConnectButton, DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
// import UserMenu from "./user-menu";
import { DarkModeToggle } from "./dark-mode-toggle";
import LightGhost from "@/public/brand_assets/light-ghost.svg"
import DarkGhost from "@/public/brand_assets/dark-ghost.svg"
import ThemeImage from "@/components/ui/theme-image";
import DynamicWaitlistButton from "./dynamic-waitlist-button";

export default function Header() {
  // const { handleLogOut, primaryWallet, user } = useDynamicContext();

  return (
    <header className="sticky flex items-center justify-center top-0 z-50 w-full bg-background/10 backdrop-blur supports-[backdrop-filter]:bg-background/10">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <ThemeImage
              className="w-6"
              lightSrc={LightGhost}
              darkSrc={DarkGhost}
              alt="AIDEN"
            />
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/about">About Us</Link>
            <Link href="/agents/Kent">Chat with an Agent</Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <DynamicWaitlistButton cta="Log In or Sign Up" />
          {/* {
            user &&
            primaryWallet &&
            <UserMenu
              logout={handleLogOut}
              user={user}
              wallet={primaryWallet}
            />
          } */}
          <DarkModeToggle />
        </div>
      </div>
    </header>
  )
}