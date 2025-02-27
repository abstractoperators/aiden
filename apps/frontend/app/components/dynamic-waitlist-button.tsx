"use client"

import { DynamicConnectButton, DynamicUserProfile, useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { Button, buttonVariants } from "@/components/ui/button"

export default function DynamicWaitlistButton({ cta }: { cta: string }) {
  const { setShowDynamicUserProfile, primaryWallet } = useDynamicContext()
  return (primaryWallet) ? (
    <div>
      <Button variant="secondary" onClick={() => setShowDynamicUserProfile(true)}>
        Configure your Profile
      </Button>
      <DynamicUserProfile />
    </div>
  ) : (
    <DynamicConnectButton buttonClassName={buttonVariants({ variant: "secondary" })}>
      {cta}
    </DynamicConnectButton>
  )
}