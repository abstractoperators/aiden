"use client"

import { TokenBase } from "@/lib/api/token";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useState,
} from "react";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";
import TokenBalance from "./balance";
import { cn } from "@/lib/utils";
import { LoginButton } from "../dynamic/login-button";
import { Input } from "../ui/input";
import { buyWithSei, sellForSei } from "@/lib/contracts/bonding";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { TransactionReceipt } from "viem";
import { toast } from "@/hooks/use-toast";

const amountStyle = [
  "!text-d3 pl-0 py-2 font-serif h-fit place-content-center border-none",
  "shadow-none",
].join(" ")

export default function SwapCard({
  token,
  // setBalance
}: {
  token?: TokenBase | null,
  // setBalance?: any,
}) {
  const [ isBuying, setIsBuying ] = useState(true)
  const [ tokenAmount, setTokenAmount ] = useState<number | "">("")
  const [ seiAmount, setSeiAmount ] = useState<number | "">("")
  const { primaryWallet } = useDynamicContext()

  const onClick = async () => {
    if (!token || !seiAmount || !tokenAmount)
      return

    const tokenAddress = token.evmContractAddress
    const receipt: TransactionReceipt = await (
      isBuying ?
      buyWithSei({
        tokenAddress,
        seiAmount,
        primaryWallet,
      }) :
      sellForSei({
        tokenAddress,
        tokenAmount,
        primaryWallet,
      })
    )

    if (receipt.status === "success") {
      toast({ title: "Swap Successful", })
    } else {
      const errorMessage = [
        receipt.from,
        receipt.to,
        receipt.status,
        receipt.transactionHash,
        receipt.type,
      ].join()
      console.error(`Unable to complete swap:\n${errorMessage}`)
      toast({
        title: "Unable to Complete Swap!",
        description: errorMessage,
      })
    }
  }

  if (token) {
    const inProps = isBuying ? {
      token: seiTokenDisplay,
      inAmount: seiAmount,
      setInAmount: setSeiAmount,
      setOutAmount: setTokenAmount,
      // TODO: replace
      convert: (x: number) => x * 2,
    } : {
      token,
      inAmount: tokenAmount,
      setInAmount: setTokenAmount,
      setOutAmount: setSeiAmount,
      // TODO: replace
      convert: (x: number) => x / 2,
    }
    const outProps = isBuying ? {
      token,
      amount: tokenAmount,
    } : {
      token: seiTokenDisplay,
      amount: seiAmount,
    }

    return (
      <Card className="items-center gap-2">
        <CardHeader className="self-start">
          <TokenBalance address={token.evmContractAddress} />
        </CardHeader>
        <CardContent
          className={cn(
            "w-full flex flex-col gap-2 items-center",
          )}
        >
          <InCard {...inProps} />
          <Button
            variant="ghost"
            className="w-4 h-8"
            onClick={() => setIsBuying(!isBuying)}
          >
            <ArrowUpDown
              className={cn(
                "transition duration-300",
                isBuying ? "" : "rotate-180",
              )}
            />
          </Button>
          <OutCard {...outProps} />
        </CardContent>
        <CardFooter>
          <LoginButton className="w-full">
            <Button disabled={!seiAmount || !tokenAmount} className="w-full" onClick={onClick}>
              Swap
            </Button>
          </LoginButton>
        </CardFooter>
      </Card>
    )
  }

  return <></>
}

type TokenDisplayType = Pick<TokenBase, "name" | "ticker">

const seiTokenDisplay: TokenDisplayType = {
  name: "Sei",
  ticker: "SEI",
}

function InCard({
  token,
  inAmount,
  setInAmount,
  setOutAmount,
  convert,
}: {
  token: TokenDisplayType,
  inAmount: number | "",
  setInAmount: Dispatch<SetStateAction<number | "">>,
  setOutAmount: Dispatch<SetStateAction<number | "">>,
  convert: (x: number) => number,
}) {
  return (
    <BaseCard
      token={token}
      title="From"
    >
      <Input
        type="number"
        onChange={e => {
          const value = e.target.value.length ? e.target.valueAsNumber : ""
          setInAmount(value)
          setOutAmount(value ? convert(value) : "")
        }}
        placeholder="0.0"
        value={inAmount}
        min={0}
        step="any"
        onKeyDown={e => {
          if (new Set(["+", "-", "Enter"]).has(e.key)) {
            e.preventDefault()
          }
        }}
        className={cn(
          "[&::-webkit-outer-spin-button]:appearance-none",
          "[&::-webkit-inner-spin-button]:appearance-none",
          "!ring-0",
          amountStyle,
        )}
      />
    </BaseCard>
  )
}

function OutCard({
  token,
  amount,
}: {
  token: TokenDisplayType,
  amount: number | "",
}) {
  return (
    <BaseCard
      token={token}
      title="To"
    >
      <Input
        disabled
        className={cn(
          "truncate pointer-events-none",
          amountStyle,
        )}
        value={amount || 0}
      />
    </BaseCard>
  )
}

function BaseCard({
  token,
  title,
  children,
}: {
  token: TokenDisplayType,
  title: string,
  children: ReactNode,
}) {
  return (
    <Card className="w-full justify-between self-stretch">
      <CardHeader>
        <CardTitle className="flex justify-between gap-2 flex-wrap">
          <p>{title}:</p>
          <p>{token.name}</p>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col">
        {children}
        <h3 className="text-neutral-700 dark:text-neutral-300">{token.ticker}</h3>
      </CardContent>
    </Card>
  )
}