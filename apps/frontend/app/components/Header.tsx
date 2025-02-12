"use client";

import Link from "next/link"
import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import UserMenu from "./userMenu";

export default function Header() {
  const { user } = useDynamicContext();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">AIDEN</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/#about">About Us</Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <DynamicWidget />
          { user && <UserMenu user={user} /> }
        </div>
      </div>
    </header>
  )
}