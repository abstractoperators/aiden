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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
        <Avatar className="cursor-pointer focus:outline-solid hover:outline-solid">
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{user.username || user.email || wallet.address}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/profile">
            <DropdownMenuItem>
                Profile
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
