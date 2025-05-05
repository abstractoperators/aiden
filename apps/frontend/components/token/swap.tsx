"use client"

import { TokenBase } from "@/lib/api/token";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";
import TokenBalance from "./balance";
import { cn } from "@/lib/utils";
import { LoginButtonSwap } from "../dynamic/login-button";

export default function SwapCard({
  token,
}: {
  token?: TokenBase | null,
}) {
  const [ isBuying, setIsBuying ] = useState(true)
  const [ tokenAmount, setTokenAmount ] = useState(0)
  const [ seiAmount, setSeiAmount ] = useState(0)

  return token ? (
    <Card className="items-center gap-2">
      <CardHeader className="self-start">
        <TokenBalance address={token.evmContractAddress} />
      </CardHeader>
      <CardContent
        className={cn(
          "w-full flex flex-col gap-2 items-center xl:flex-row",
        )}
      >
        <TokenCard
          isInput={true}
          token={isBuying ? seiTokenDisplay : token}
          amount={tokenAmount}
        />
        <Button
          variant="ghost"
          className="w-4 h-8"
          onClick={() => setIsBuying(!isBuying)}
        >
          <ArrowUpDown
            className={cn(
              "transition duration-300",
              isBuying ? "xl:rotate-90" : "rotate-180 xl:-rotate-90",
            )}
          />
        </Button>
        <TokenCard
          isInput={false}
          token={isBuying ? token : seiTokenDisplay}
          amount={seiAmount}
        />
      </CardContent>
      <CardFooter>
        <LoginButtonSwap className="w-full" />
      </CardFooter>
    </Card>
  ) : (
    <></>
  )
}

type TokenDisplayType = Pick<TokenBase, "name" | "ticker">

const seiTokenDisplay: TokenDisplayType = {
  name: "Sei",
  ticker: "SEI",
}

function TokenCard({
  isInput,
  token,
  amount,
}: {
  isInput: boolean,
  token: TokenDisplayType,
  amount: number,
}) {
  return (
    <Card className="w-full justify-between self-stretch">
      <CardHeader>
        <CardTitle className="flex justify-between gap-2 flex-wrap">
          <p>{isInput ? "From" : "To"}:</p>
          <p>{token.name}</p>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col">
        <h2>{amount}</h2>
        <h3 className="text-neutral-700 dark:text-neutral-300">{token.ticker}</h3>
      </CardContent>
    </Card>
  )
}