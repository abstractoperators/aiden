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
import { getDisplayName } from "@/lib/dynamic/user";

const iconClassName = "h-[1.2rem] w-[1.2rem]"

export default function UserMenu({
  logout,
  user,
  wallet,
}: {
  logout: () => Promise<void>,
  user: UserProfile,
  wallet: Wallet,
}) {
  const displayName = getDisplayName(user, wallet)
  const { setShowDynamicUserProfile } = useDynamicContext()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarFallback className="bg-[#181C23] border-2 border-[orange] hover:border-orange-400 transition">
            {
              (displayName === wallet.address) ?
              displayName.substring(0, 2) :
              displayName[0]
            }
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-alexandria">{displayName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/user">
            <DropdownMenuItem>
              <LayoutDashboard className={iconClassName} />
              <span className="font-alexandria">Control Center</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className={iconClassName} />
            <span className="font-alexandria">Logout</span>
          </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {/* <AppearanceMenu /> */}
          <DropdownMenuItem onClick={() => setShowDynamicUserProfile(true)}>
            <Settings2 className={iconClassName} />
            <span className="font-alexandria">User Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
      <DynamicUserProfile />
    </DropdownMenu>
  )
}
