"use client"

import { DynamicConnectButton, useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { Button, buttonVariants } from "@/components/ui/button"
import UserMenu from "@/components/user-menu"
import Link from "next/link"

interface DynamicConnectButtonProps {
  width: number,
  height?: number,
  textSize?: string,
}

const radialGradient = "bg-[radial-gradient(276.98%_284.46%_at_25.31%_13.8%,rgba(213,210,255,.8)_0%,rgba(6,109,255,.8)_100%)]"
const getTextSize = (textSize?: string) => textSize ? `text-${textSize}` : ""
const getCommon = ({width, height, textSize}: DynamicConnectButtonProps) => (
  `px-${width} py-${height ?? width} ${getTextSize(textSize)} font-bold rounded-lg duration-300`
)

function DynamicConnectButtonBase({
  children,
  width,
  height,
  textSize,
}: React.PropsWithChildren<DynamicConnectButtonProps>) {
  const { primaryWallet, user } = useDynamicContext()
  return (primaryWallet && user) ? (
    <div>
      {children}
    </div>
  ) : (
    <DynamicConnectButton>
      <div className={`${buttonVariants()} ${getCommon({width, height, textSize})} ${radialGradient} duration-300 hover:hue-rotate-60`}>
        <div className="font-bold text-black">
          Join the Waitlist
        </div>
      </div>
    </DynamicConnectButton>
  )
}

function DynamicConnectButtonHero({
  width,
  height,
  textSize,
}: DynamicConnectButtonProps) {
  const bg = "bg-anakiwa-darker dark:bg-anakiwa-darker hover:bg-anakiwa-dark dark:hover:bg-anakiwa text-white dark:hover:text-black"

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