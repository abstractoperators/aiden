"use client"

import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { RefreshCcw } from "lucide-react";
import { getTokenBalance } from "@/lib/contracts/token";
import { toast } from "@/hooks/use-toast";

export default function TokenBalance({
  address,
}: {
  address: `0x${string}`,
}) {
  const { primaryWallet } = useDynamicContext();
  const [formattedBalance, setBalance] = useState<string>("");
  const [isDisabled, setIsDisabled] = useState(false)

  const getBalance = useCallback(async () => {
    setIsDisabled(true)
    try {
      setBalance(await getTokenBalance({address, primaryWallet}));
    } catch (error) {
      console.error(error)
      toast({
        title: "Unable to get balance!",
        description: `${error}`,
      })
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