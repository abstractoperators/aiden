'use client'

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DynamicUserProfile,
  useDynamicContext,
  UserProfile,
  Wallet,
} from "@dynamic-labs/sdk-react-core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import AppearanceMenu from "./appearance-menu";
import { LayoutDashboard, LogOut, Settings2 } from "lucide-react";

export default function UserMenu({
  logout,
  user,
  wallet,
}: {
  logout: () => Promise<void>,
  user: UserProfile,
  wallet: Wallet,
}) {
  const displayName = user.username || user.email || wallet.address
  const { setShowDynamicUserProfile } = useDynamicContext()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer focus:outline-solid hover:outline-solid hover:opacity-60 transition duration-300">
          <AvatarFallback>{displayName.substring(0, 2)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/user">
            <DropdownMenuItem>
              <LayoutDashboard className="h-[1.2rem] w-[1.2rem]" />
              <span>Control Center</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="h-[1.2rem] w-[1.2rem]" />
            <span>Logout</span>
          </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <AppearanceMenu />
          <DropdownMenuItem onClick={() => setShowDynamicUserProfile(true)}>
            <Settings2 className="h-[1.2rem] w-[1.2rem]" />
            <span>User Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
      <DynamicUserProfile />
    </DropdownMenu>
  )
}
