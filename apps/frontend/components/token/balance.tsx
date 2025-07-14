"use client"

import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { useDynamicContext, Wallet } from "@dynamic-labs/sdk-react-core";
import {
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";
import { getTokenBalance } from "@/lib/contracts/token";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import RefreshButton from "../ui/refresh-button";

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
    <div className="w-full flex items-center justify-between gap-2">
      <hgroup
        className={cn(
          "flex items-center justify-between gap-2 text-d6 shrink truncate",
        )}
      >
        <h4>Balance:</h4>
        <h4 className="text-anakiwa-dark dark:text-anakiwa-light shrink truncate">{formattedBalance}</h4>
      </hgroup>
      <RefreshButton
        onClick={() =>
          updateBalanceState({
            address,
            primaryWallet,
            setBalance,
            setIsDisabled,
          })
        }
        disabled={isDisabled}
      />
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
    if (primaryWallet)
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