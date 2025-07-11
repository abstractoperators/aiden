import { Button } from "@/components/ui/button";
import TokenTabs from "./tabs";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function TokensDashboard() {
  return (
    <main className="flex-1 self-stretch flex flex-col gap-8 m-8 bg-neutral-600/40 backdrop-blur p-8 rounded-xl">
      <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
        Tokens
      </h1>
      <TokenTabs />
      <div>
        <Button
          className={cn(
            "bg-gradient-to-br from-anakiwa dark:from-anakiwa-dark from-20% to-carnation dark:to-carnation-dark to-80%",
            "font-semibold text-white dark:text-white",
            "transition-all duration-300 hover:scale-105 hover:shadow-lg",
            "rounded-xl shadow-md",
            "hover:from-anakiwa-dark hover:to-carnation-dark dark:hover:from-anakiwa dark:hover:to-carnation"
          )}
          size="lg"
          asChild
        >
          <Link href='/tokens/launch' >
            Launch a Token
          </Link>
        </Button>
      </div>
    </main>
  )
}