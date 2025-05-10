import { toast } from "@/hooks/use-toast"
import { getTokenInfo } from "@/lib/contracts/bonding"
import { Dispatch, SetStateAction } from "react"

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