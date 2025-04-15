import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function CreateAgentButton() {
  return (
    <Button
      className={cn(
        "bg-gradient-to-br from-anakiwa dark:from-anakiwa-dark from-20% to-carnation dark:to-carnation-dark to-80%",
        "font-semibold text-black dark:text-white",
        "transition duration-300 hover:hue-rotate-60",
        "rounded-xl",
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