"use client"

import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { Button } from "@/components/ui/button"
import UserMenu from "@/components/user-menu"
import Link from "next/link"
import { cn } from "@/lib/utils"

const common = (
  [
    "font-semibold",
    "text-white",
    "dark:text-white",
    "rounded-xl",
    "transition-all",
    "duration-300",
    "hover:scale-105",
    "hover:shadow-lg",
  ]
  .join(" ")
)

function LoginButton({
  children,
  className,
}: React.PropsWithChildren<{className?: string}>) {
  
  const { primaryWallet, user, setShowAuthFlow } = useDynamicContext()

  return (primaryWallet && user) ? (
    <>{children}</>
  ) : (
    <button
      className={cn(
        "hover:text-anakiwa transition-all duration-300 font-pixelcraft cursor-pointer hover:scale-105",
        className,
      )}
      onClick={() => setShowAuthFlow(true)}
    >
      Register
    </button>
  )
}

function LoginButtonHero({className}: {className?: string}) {
  const bg = (
    [
      "bg-gradient-to-br",
      "from-anakiwa-dark",
      "from-20%",
      "to-carnation-dark",
      "to-80%",
      "hover:from-anakiwa",
      "hover:to-carnation",
      "shadow-md",
    ]
    .join(" ")
  )

  return <LoginButton className={className}>
    <Button
      className={cn(
        className,
        common,
        bg,
      )}
    >
      <Link href="/user/agents/creation">
        Create an Agent
      </Link>
    </Button>
  </LoginButton>
}

function LoginButtonHeader({className}: {className?: string}) {
  const { handleLogOut, primaryWallet, user } = useDynamicContext()
  return <LoginButton className={className}>
    {
      user &&
      primaryWallet &&
      <div className="flex items-center justify-between gap-2">
        <UserMenu
          logout={handleLogOut}
          user={user}
          wallet={primaryWallet}
        />
      </div>
    }
  </LoginButton>
}

export {
  LoginButton,
  LoginButtonHeader,
  LoginButtonHero,
}