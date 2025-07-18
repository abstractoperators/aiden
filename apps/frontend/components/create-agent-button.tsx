import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function CreateAgentButton() {
  return (
    <Button
      className={cn(
        "bg-gradient-to-br from-anakiwa dark:from-anakiwa-dark from-20% to-carnation dark:to-carnation-dark to-80%",
        "font-semibold text-white dark:text-white",
        "transition-all duration-300 hover:scale-105 hover:shadow-lg",
        "rounded-xl shadow-md",
        "hover:from-anakiwa-dark hover:to-carnation-dark dark:hover:from-anakiwa dark:hover:to-carnation"
      )}
      size='lg'
      asChild
    >
      <Link href="/user/agents/creation">
        <Plus strokeWidth={5}/>
        <span>Create an Agent</span>
      </Link>
    </Button>
  )
}