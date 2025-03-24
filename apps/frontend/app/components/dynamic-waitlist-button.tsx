"use client"

import { DynamicConnectButton, DynamicUserProfile, useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { Button, buttonVariants } from "@/components/ui/button"

interface DynamicWaitlistButtonProps {
  width: number,
  connectHeight?: number
  height?: number,
  textSize?: string,
}

const radialGradient = "bg-[radial-gradient(276.98%_284.46%_at_25.31%_13.8%,rgba(213,210,255,.8)_0%,rgba(6,109,255,.8)_100%)]"

export default function DynamicWaitlistButton({
  children,
  width,
  height,
  textSize,
}: React.PropsWithChildren<DynamicWaitlistButtonProps>) {
  const { setShowDynamicUserProfile, primaryWallet } = useDynamicContext()
  const textStyle = textSize ? `text-${textSize}` : ""
  const getCommon = (width: number, height?: number) => `px-${width} py-${height ?? width} ${textStyle} font-bold rounded-lg duration-300`
  return (primaryWallet) ? (
    <div>
      <Button className={getCommon(width, height)} onClick={() => setShowDynamicUserProfile(true)}>
        Configure your Profile
      </Button>
      <DynamicUserProfile />
    </div>
  ) : (
    <DynamicConnectButton>
      <div className={`${buttonVariants()} ${getCommon(width, height)} ${radialGradient} duration-300 hover:hue-rotate-60`}>
        <div className="font-bold text-black">
          {children}
        </div>
      </div>
    </DynamicConnectButton>
  )
}