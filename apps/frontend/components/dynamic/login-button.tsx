"use client"

import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { Button } from "@/components/ui/button"
import UserMenu from "@/components/user-menu"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SessionProvider } from "next-auth/react"

const common = (
  [
    "font-semibold",
    "text-black",
    "dark:text-white",
    "rounded-xl",
    "transition",
    "duration-300",
  ]
  .join(" ")
)

function LoginButton({
  children,
  className,
}: React.PropsWithChildren<{className?: string}>) {
  const bg = (
    [
      "bg-gradient-to-br",
      "from-anakiwa",
      "from-20%",
      "to-carnation",
      "to-80%",
      "hover:hue-rotate-60",
    ]
    .join(" ")
  )
  const { primaryWallet, user, setShowAuthFlow } = useDynamicContext()

  return (primaryWallet && user) ? (
    <SessionProvider>
      {children}
    </SessionProvider>
  ) : (
    <Button
      className={cn(
        className,
        common,
        bg,
      )}
      onClick={() => setShowAuthFlow(true)}
    >
      Join the Waitlist
    </Button>
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
      "hover:hue-rotate-60",
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
      asChild
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
      <UserMenu
        logout={handleLogOut}
        user={user}
        wallet={primaryWallet}
      />
    }
  </LoginButton>
}

export {
  LoginButtonHeader,
  LoginButtonHero,
}