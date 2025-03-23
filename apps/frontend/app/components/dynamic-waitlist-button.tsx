"use client"

import { DynamicConnectButton, DynamicUserProfile, useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { Button } from "@/components/ui/button"

interface DynamicWaitlistButtonProps {
  width: number,
  connectHeight?: number
  height?: number,
  textSize?: string,
}

const radialGradient = "bg-[radial-gradient(276.98%_284.46%_at_25.31%_13.8%,rgba(213,210,255,.8)_0%,rgba(6,109,255,.8)_100%)]"
const getSize = (width: number, height?: number) => `px-${width} py-${height ?? width}`

export default function DynamicWaitlistButton({
  children,
  width,
  connectHeight,
  height,
  textSize,
}: React.PropsWithChildren<DynamicWaitlistButtonProps>) {
  const { setShowDynamicUserProfile, primaryWallet } = useDynamicContext()
  const textStyle = textSize ? `text-${textSize}` : ""
  const className = (classSize: string) => `font-bold ${classSize} ${textStyle} text-black rounded-lg transition hover:opacity-80 ${radialGradient}`
  return (primaryWallet) ? (
    <div>
      <Button variant="secondary" className={`${getSize(width, height)} ${textStyle}`} onClick={() => setShowDynamicUserProfile(true)}>
        Configure your Profile
      </Button>
      <DynamicUserProfile />
    </div>
  ) : (
    <DynamicConnectButton buttonClassName={className(getSize(width, connectHeight))}>
      {children}
    </DynamicConnectButton>
  )
}