"use client"

import { getSeiNet } from "@/lib/utils";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useCallback, useEffect, useState } from "react";
import { createPublicClient, formatUnits, getContract, http } from "viem";
import { Button } from "../ui/button";
import { RefreshCcw } from "lucide-react";
import ERC20_JSON from "@/lib/abis/ferc20.json";

const ERC20_ABI = ERC20_JSON.abi;

export default function TokenBalance({
  address,
}: {
  address: `0x${string}`,
}) {
  const { primaryWallet } = useDynamicContext();
  const [formattedBalance, setBalance] = useState<string>("");
  const [isDisabled, setIsDisabled] = useState(false)

  const getBalance = useCallback(async () => {
    if (!primaryWallet || !isEthereumWallet(primaryWallet))
      return
    setIsDisabled(true)
    try {
      const client = await primaryWallet.getPublicClient().catch(err => {
        console.error(`Error creating public client from primary wallet: ${err}`)
        return createPublicClient({
          chain: getSeiNet(),
          transport: http(),
        })
      })

      const tokenContract = getContract({
          address,
          abi: ERC20_ABI,
          client,
      });
      const balance = await tokenContract.read.balanceOf([primaryWallet.address]) as bigint;
      const decimals = await tokenContract.read.decimals() as number;

      const formattedBalance = formatUnits(balance, decimals);
      setBalance(formattedBalance.toString());
    } catch (error) {
      console.error(error)
    } finally {
      setIsDisabled(false)
    }
  }, [address, primaryWallet])
  
  useEffect(() => { getBalance() }, [getBalance])

  if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
    return <></>
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-between gap-2">
        <p>Balance:</p>
        <p className="text-anakiwa-light">{formattedBalance}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={getBalance}
        disabled={isDisabled}
      >
        <RefreshCcw className={isDisabled ? "animate-spin" : ""} />
      </Button>
    </div>
  );
};