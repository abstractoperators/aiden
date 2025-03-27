"use client"

import { DynamicConnectButton, useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { Button, buttonVariants } from "@/components/ui/button"
import UserMenu from "@/components/user-menu"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface DynamicConnectButtonProps {
  width: number,
  height?: number,
  textSize?: string,
}

const getTextSize = (textSize?: string) => textSize ? `text-${textSize}` : ""
const getCommon = ({width, height, textSize}: DynamicConnectButtonProps) => ([
    `px-${width}`,
    `py-${height ?? width}`,
    getTextSize(textSize),
    "font-semibold",
    "text-black",
    "dark:text-white",
    "rounded-xl",
    "transition",
    "duration-300",
  ]
  .join(" ")
)

function DynamicConnectButtonBase({
  children,
  width,
  height,
  textSize,
}: React.PropsWithChildren<DynamicConnectButtonProps>) {
  const bg = "bg-gradient-to-br from-anakiwa from-20% to-carnation to-80% hover:hue-rotate-60"
  const { primaryWallet, user } = useDynamicContext()

  return (primaryWallet && user) ? (
    <div>
      {children}
    </div>
  ) : (
    // <div className={`${buttonVariants({ variant: 'default' })} ${getCommon({width, height, textSize})} ${bg}`}>
      <DynamicConnectButton>
          <div className={cn(getCommon({width, height, textSize}), bg)}>
            Join the Waitlist
          </div>
      </DynamicConnectButton>
    // </div
  )
}

function DynamicConnectButtonHero({
  width,
  height,
  textSize,
}: DynamicConnectButtonProps) {
  const bg = "bg-gradient-to-br from-anakiwa-dark from-20% to-carnation-dark to-80% hover:hue-rotate-60"

  return <DynamicConnectButtonBase
    width={width}
    height={height}
    textSize={textSize}
  >
    <Button
      className={`${getCommon({width, height, textSize})} ${bg}`}
      asChild
    >
      <Link href="/user/agents/creation">
        Create an Agent
      </Link>
    </Button>
  </DynamicConnectButtonBase>
}

function DynamicConnectButtonHeader({
  width,
  height,
  textSize,
}: DynamicConnectButtonProps) {
  const { handleLogOut, primaryWallet, user } = useDynamicContext()
  return <DynamicConnectButtonBase
    width={width}
    height={height}
    textSize={textSize}
  >
    {
      user &&
      primaryWallet &&
      <UserMenu
        logout={handleLogOut}
        user={user}
        wallet={primaryWallet}
      />
    }
  </DynamicConnectButtonBase>
}

export default DynamicConnectButtonBase
export {
  DynamicConnectButtonHeader,
  DynamicConnectButtonHero,
}