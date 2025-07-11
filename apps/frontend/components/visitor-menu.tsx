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
        <Button 
          variant="ghost" 
          size="icon"
          className="hover:bg-anakiwa hover:text-white transition-all duration-300 hover:scale-105 rounded-xl"
        >
          <EllipsisVertical className="h-[1.2rem] w-[1.2rem]"/>
          <span className="sr-only">Theme Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-panel border border-border shadow-lg">
        <AppearanceMenu />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}