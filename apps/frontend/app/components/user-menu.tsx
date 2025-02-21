import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserProfile, Wallet } from "@dynamic-labs/sdk-react-core";
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer focus:outline-solid hover:outline-solid transition-[color,drop-shadow] hover:bg-destructive/100">
          <AvatarFallback>{displayName.substring(0, 2)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/user/agents/create">
            <DropdownMenuItem>
              Control Center
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
         <Link href="/">
          <DropdownMenuItem onClick={logout}>
            Log out
          </DropdownMenuItem>
         </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
