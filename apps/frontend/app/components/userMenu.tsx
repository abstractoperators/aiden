import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
        <Button variant="ghost" size="icon">
        <Avatar className="cursor-pointer focus:outline-solid hover:outline-solid">
          <AvatarFallback>{displayName.substring(0, 2)}</AvatarFallback>
        </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/user">
            <DropdownMenuItem>
              User Home
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
