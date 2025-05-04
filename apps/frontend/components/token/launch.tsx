"use client";

import { useDynamicContext, Wallet } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { FC } from "react";
import { getContract, parseEther, parseEventLogs } from "viem";
import { FormEventHandler } from "react";
import BONDING_JSON from "@/lib/abis/bonding.json";
import ERC20_JSON from "@/lib/abis/ferc20.json";
import { saveToken } from "@/lib/api/token";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { capitalize } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { isErrorResult } from "@/lib/api/result";
import { toast } from "@/hooks/use-toast";

const BONDING_CONTRACT_ADDRESS = "0xDdFF841E7bb9c2180D160eE5E11663ca127Fd21e";
const BONDING_ABI = BONDING_JSON.abi;
const ERC20_ABI = ERC20_JSON.abi;

const launchSchema = z.object({
  tokenName: z.string().min(1, "Name cannot be empty"),
  ticker: z.string().min(1, "Ticker cannot be empty"),
})
type FormType = z.infer<typeof launchSchema>

function launchTokenFactory(wallet: Wallet | null) {
  async function launchToken({
    tokenName: name,
    ticker,
  }: FormType): Promise<string> {
    if (!wallet || !isEthereumWallet(wallet))
      return ""
    try {
      const walletClient = await wallet.getWalletClient();
      const publicClient = await wallet.getPublicClient();
      if (!publicClient) throw new Error("No public client available");
      if (!walletClient) throw new Error("No wallet client available");

      // Create contract instance with the signer
      const bondingContract = getContract({
          address: BONDING_CONTRACT_ADDRESS,
          abi: BONDING_ABI,
          client: { public: publicClient, wallet: walletClient }
      });

      const launchFee = await bondingContract.read.assetLaunchFee() as bigint;
      console.log("Launch fee:", launchFee);

      const launchSimulation = await bondingContract.simulate.launchWithSei(
        [name, ticker],
        { value: launchFee }
      );

      console.debug("Launch Simulation", launchSimulation)

      const launchHash = await bondingContract.write.launchWithSei(
        [name, ticker],
        { value: launchFee }
      );

      console.debug("Launch Hash", launchHash)

      const launchReceipt = await publicClient.waitForTransactionReceipt({
          hash: launchHash,
          confirmations: 1,
      });

      const launchedEvents = parseEventLogs({
          abi: BONDING_ABI,
          logs: launchReceipt.logs,
          eventName: "Launched",
      });
      if (launchedEvents.length === 0) {
          throw new Error("No Launched event found in transaction receipt");
      }
      if (launchedEvents.length > 1) {
          console.warn("Multiple Launched events found in transaction receipt");
      }

      const launchedEvent = launchedEvents[0];
      // @ts-expect-error it's because I didn't want to make my own type and find the Log type from which LaunchedEvent inherits, and .args doesn't exist on the Log type by default but istg it does on the Launched Event.
      const tokenAddress = launchedEvent.args[0] as `0x${string}`;
      console.log("Token launched at:", tokenAddress);

      const tokenPayload = {
          name,
          ticker,
          evmContractAddress: tokenAddress,
          abi: ERC20_ABI, // maybe we stop saving an abi for each token - dunno.
      };

      const tokenResult = await saveToken(tokenPayload)
      if (isErrorResult(tokenResult)) {
        toast({
          title: `Unable to save token ${name} ($${ticker})`,
          description: tokenResult.message,
        })
        return ""
      }

      toast({
        title: `Token ${name} ($${ticker}) created!`
      })
      const { id } = tokenResult.data

      return id
    } catch (error) {
      console.error("Error launching token:", error);
      throw error
    }
  }

  return launchToken
}

function TokenForm() {
  const { primaryWallet: wallet } = useDynamicContext();
  const { push } = useRouter()

  const form = useForm<FormType>({
    resolver: zodResolver(launchSchema),
    defaultValues: {
      tokenName: "",
      ticker: "",
    }
  })
  const { handleSubmit } = form

  const onSubmit = async (formData: FormType) => {
    const id = await launchTokenFactory(wallet)(formData)
    push(`/tokens/${id}`)
  }
  
  if (!wallet || !isEthereumWallet(wallet))
    return (<>Please sign into an Ethereum wallet.</>);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {[ "name", "ticker" ].map(name => (
          <FormField
            key={name}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel></FormLabel>
                <FormControl>
                  <Input
                    className="placeholder:text-neutral-500"
                    placeholder={capitalize(name)}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        ))}
        <Button type="submit">Launch Token</Button>
      </form>
    </Form>
  )
};

const BuyWithSei: FC<{
    tokenAddress: string;
}> = ({ tokenAddress,
}) => {
        const { primaryWallet } = useDynamicContext();

        if (!primaryWallet || !isEthereumWallet(primaryWallet)) return (<>Must be connected to ethereum wallet.</>);

        const onSubmit: FormEventHandler = async (event) => {
            event.preventDefault();

            try {
                const walletClient = await primaryWallet.getWalletClient();
                const publicClient = await primaryWallet.getPublicClient();
                if (!publicClient) throw new Error("No public client available");
                if (!walletClient) throw new Error("No wallet client available");

                // Create contract instance with the signer
                const bondingContract = getContract({
                    address: BONDING_CONTRACT_ADDRESS,
                    abi: BONDING_ABI,
                    client: { public: publicClient, wallet: walletClient }
                });

                const formData = new FormData(event.target as HTMLFormElement);
                const amount = formData.get("amount") as string;

                const buyHash = await bondingContract.write.buyWithSei(
                    [tokenAddress],
                    {
                        value: parseEther(amount)
                    }
                );

                await publicClient.waitForTransactionReceipt({
                    hash: buyHash,
                    confirmations: 1,
                });

                console.log("Token bought successfully! Transaction hash:", buyHash);

            } catch (error) {
                console.error("Error buying token:", error);
            }
        };

        return (
            <form onSubmit={onSubmit}>
                <p> Buy Token</p>
                <input
                    type="text"
                    name="amount"
                    placeholder="Amount Sei"
                />
                <button type="submit"> Buy Token </button>
            </form>
        );
    };

const SellForSei: FC<{
    tokenAddress: `0x${string}`;
}> = ({ tokenAddress }) => {
    const { primaryWallet } = useDynamicContext();
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) return (<>Must be connected to ethereum wallet.</>);

    const onSubmit: FormEventHandler = async (event) => {
        event.preventDefault();
        try {
            const walletClient = await primaryWallet.getWalletClient();
            const publicClient = await primaryWallet.getPublicClient();
            if (!publicClient) throw new Error("No public client available");
            if (!walletClient) throw new Error("No wallet client available");

            // Create contract instance with the signer
            const bondingContract = getContract({
                address: BONDING_CONTRACT_ADDRESS,
                abi: BONDING_ABI,
                client: { public: publicClient, wallet: walletClient }
            });

            const formData = new FormData(event.target as HTMLFormElement);
            const amount = formData.get("amount") as string;
            const parsedAmount = parseEther(amount);

            // Approve the bonding contract to spend the token
            const tokenContract = getContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                client: { public: publicClient, wallet: walletClient }
            });
            const approveHash = await tokenContract.write.approve(
                [BONDING_CONTRACT_ADDRESS, parsedAmount],
                {
                    gasLimit: 100000,
                }
            );
            await publicClient.waitForTransactionReceipt({
                hash: approveHash,
                confirmations: 1,
            });
            console.log("Approval transaction hash:", approveHash);
            const buyHash = await bondingContract.write.sellForSei(
                [parsedAmount, tokenAddress],
            );

            await publicClient.waitForTransactionReceipt({
                hash: buyHash,
                confirmations: 1,
            });

            console.log("Token bought successfully! Transaction hash:", buyHash);

        } catch (error) {
            console.error("Error buying token:", error);
        }
    };


    return (
        <form onSubmit={onSubmit}>
            <p> Sell Token</p>
            <input
                type="text"
                name="amount"
                placeholder="Amount Token"
            />
            <button type="submit"> Sell Token </button>
        </form>
    );
}

export {
  BuyWithSei,
  launchSchema,
  launchTokenFactory,
  SellForSei,
};

export type {
  FormType as TokenLaunchType
}

export default TokenForm