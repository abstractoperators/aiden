"use client"

import { toast } from "@/hooks/use-toast"
import { getTokenInfo } from "@/lib/contracts/bonding"
import { Dispatch, SetStateAction, useEffect } from "react"
import RefreshButton from "../ui/refresh-button"
import { cn } from "@/lib/utils"

function TokenPrice({
  address,
  priceState,
  isDisabledState,
}: {
  address: `0x${string}`,
  priceState: [bigint, Dispatch<SetStateAction<bigint>>],
  isDisabledState: [boolean, Dispatch<SetStateAction<boolean>>],
}) {
  const [price, setPrice] = priceState
  const [isDisabled, setIsDisabled] = isDisabledState

  // It's bad practice to call onClick in useEffect, even if it means
  // code duplication.
  useEffect(() => {
    (async () => {
      updateTokenPriceState({
        address,
        setPrice,
        setIsDisabled,
      })
    })()
  }, [address, setIsDisabled, setPrice])

  return (
    <div className="w-full flex items-center justify-between gap-2">
      <hgroup
        className={cn(
          "flex items-center justify-between gap-2 text-d6 shrink truncate"
        )}
      >
        <h4>Price:</h4>
        <h4 className="text-anakiwa-dark dark:text-anakiwa-light shrink truncate">{price}</h4>
      </hgroup>
      <RefreshButton
        onClick={async () => {
          updateTokenPriceState({
            address,
            setPrice,
            setIsDisabled,
          })
        }}
        disabled={isDisabled}
      />
    </div>
  )
}

async function updateTokenPriceState({
  address,
  setPrice,
  setIsDisabled,
}: {
  address: `0x${string}`,
  setPrice: Dispatch<SetStateAction<bigint>>,
  setIsDisabled: Dispatch<SetStateAction<boolean>>,
}) {
  setIsDisabled(true)
  try {
    const tokenPrice = (await getTokenInfo({address})).data.price
    console.debug("Token at", address, "is worth", tokenPrice, "SEI")
    setPrice(tokenPrice)
  } catch (error) {
    console.error(error)
    toast({
      title: "Unable to fetch price!",
      description: `${error}`,
    })
  } finally {
    setIsDisabled(false)
  }
}

export {
  updateTokenPriceState,
}

export default TokenPrice