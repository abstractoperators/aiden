import { EllipsisVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import AppearanceMenu from "./appearance-menu"

export default function VisitorMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <EllipsisVertical className="h-[1.2rem] w-[1.2rem]"/>
          <span className="sr-only">Visitor Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <AppearanceMenu />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}