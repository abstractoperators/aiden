"use client"

import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { useDynamicContext, Wallet } from "@dynamic-labs/sdk-react-core";
import {
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";
import { Button } from "../ui/button";
import { RefreshCcw } from "lucide-react";
import { getTokenBalance } from "@/lib/contracts/token";
import { toast } from "@/hooks/use-toast";

function TokenBalance({
  address,
  balanceState,
  isDisabledState,
}: {
  address: `0x${string}`,
  balanceState: [string, Dispatch<SetStateAction<string>>],
  isDisabledState: [boolean, Dispatch<SetStateAction<boolean>>],
}) {
  const { primaryWallet } = useDynamicContext();
  const [formattedBalance, setBalance] = balanceState
  const [isDisabled, setIsDisabled] = isDisabledState

  // It's bad practice to call onClick in useEffect, even if it means
  // code duplication.
  useEffect(() => {
    (async () => {
      updateBalanceState({
        address,
        primaryWallet,
        setBalance,
        setIsDisabled,
      })
    })()
  }, [address, primaryWallet, setBalance, setIsDisabled])

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
        onClick={() =>
          updateBalanceState({
            address,
            primaryWallet,
            setBalance,
            setIsDisabled,
          })
        }
        disabled={isDisabled}
      >
        <RefreshCcw className={isDisabled ? "animate-spin" : ""} />
      </Button>
    </div>
  );
};

async function updateBalanceState({
  address,
  primaryWallet,
  setBalance,
  setIsDisabled,
}: {
  address: `0x${string}`,
  primaryWallet: Wallet | null,
  setBalance: Dispatch<SetStateAction<string>>,
  setIsDisabled: Dispatch<SetStateAction<boolean>>,
}) {
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
}

export {
  updateBalanceState
}

export default TokenBalance