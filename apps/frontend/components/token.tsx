"use client";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { ethers } from "ethers";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { FC, useState } from "react";
import { getContract } from "viem";
import { parseEventLogs } from "viem";
import { FormEventHandler } from "react";
import BONDING_JSON from "@/lib/abis/bonding.json";
const BONDING_CONTRACT_ADDRESS = "0xDdFF841E7bb9c2180D160eE5E11663ca127Fd21e";
const BONDING_ABI = BONDING_JSON.abi;


const TokenLaunch: FC<{
    tokenName: string;
    tokenTicker: string;
}> = ({ tokenName, tokenTicker }) => {
    const { primaryWallet } = useDynamicContext();
    const [status, setStatus] = useState<{
        loading: boolean;
        success?: string;
        error?: string;
    }>({ loading: false });

    if (!primaryWallet || !isEthereumWallet(primaryWallet)) return (<>No wallet</>);


    const onSubmit: FormEventHandler = async (event) => {
        event.preventDefault();
        setStatus({ loading: true });

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

            const launchFee = await bondingContract.read.assetLaunchFee() as string;
            console.log("Launch fee:", launchFee.toString());

            const formData = new FormData(event.target as HTMLFormElement);
            const name = formData.get("tokenName") as string;
            const ticker = formData.get("tokenTicker") as string;

            const launchHash = await bondingContract.write.launchWithSei(
                [name, ticker],
                {
                    value: launchFee
                }
            );

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


            const launchedEvent = launchedEvents[0] as any;
            const tokenAddress = launchedEvent.args[0] as string;
            console.log("Token launched at:", tokenAddress);


            setStatus({
                loading: false,
                success: `Token ${name} (${ticker}) launched successfully! Transaction hash: ${launchHash}`,
            });
        } catch (error) {
            console.error("Error launching token:", error);
            setStatus({
                loading: false,
                error: error instanceof Error ? error.message : "Unknown error occurred"
            });
        }
    };

    return (
        <form onSubmit={onSubmit}>
            <p> Launch Token</p>
            <input
                type="text"
                name="tokenName"
                placeholder="Token Name"
                defaultValue={tokenName}
            />
            <input
                type="text"
                name="tokenTicker"
                placeholder="Token Ticker"
                defaultValue={tokenTicker}
            />
            <button type="submit"> Launch Token </button>
        </form>
    );
};

export { TokenLaunch };
