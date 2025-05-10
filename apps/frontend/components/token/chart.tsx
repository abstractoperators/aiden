"use client"

import { useEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";
import RefreshButton from "../ui/refresh-button";
import { updateTokenPriceState } from "./updaters";

export default function TokenChart({
  address,
}: {
  address?: `0x${string}`,
}) {
  const [price, setPrice] = useState<bigint>(BigInt(0))
  const [isDisabled, setIsDisabled] = useState(false)

  useEffect(() => {
    if (!address)
      return
    (async () => {
      updateTokenPriceState({
        address,
        setPrice,
        setIsDisabled,
      })
    })()
  }, [address])

  if (!address)
    return <></>

  return (
    <Card>
      <CardContent>
        {price}
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
      </CardContent>
    </Card>
  )
}