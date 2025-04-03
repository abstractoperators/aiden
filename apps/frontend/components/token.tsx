"use client";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { FC, useState } from "react";
import { getContract, formatUnits } from "viem";
import { parseEther } from "viem";
import { parseEventLogs } from "viem";
import { FormEventHandler } from "react";
import BONDING_JSON from "@/lib/abis/bonding.json";
import ERC20_JSON from "@/lib/abis/ferc20.json";
import { saveToken } from "@/lib/api/token";

const BONDING_CONTRACT_ADDRESS = "0xDdFF841E7bb9c2180D160eE5E11663ca127Fd21e";
const BONDING_ABI = BONDING_JSON.abi;
const ERC20_ABI = ERC20_JSON.abi;

const TokenLaunch: FC = () => {
    const { primaryWallet } = useDynamicContext();

    if (!primaryWallet || !isEthereumWallet(primaryWallet)) return (<>Please sign into an Ethereum wallet.</>);


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


            const launchedEvent = launchedEvents[0];
            // @ts-expect-error
            const tokenAddress = launchedEvent.args[0] as `0x${string}`;
            console.log("Token launched at:", tokenAddress);

            const tokenPayload = {
                name,
                ticker,
                evmContractAddress: tokenAddress,
                abi: ERC20_ABI, //maybe we stop saving an abi for each token - dunno.
            };


            saveToken(tokenPayload)

        } catch (error) {
            console.error("Error launching token:", error);
        }
    };

    return (
        <form onSubmit={onSubmit}>
            <p> Launch Token</p>
            <input
                type="text"
                name="tokenName"
                placeholder="Token Name"
            />
            <input
                type="text"
                name="tokenTicker"
                placeholder="Token Ticker"
            />
            <button type="submit"> Launch Token </button>
        </form>
    );
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


const Balance: FC<{
    tokenAddress: `0x${string}`;
}> = ({ tokenAddress }) => {
    const { primaryWallet } = useDynamicContext();
    const [formattedBalance, setBalance] = useState<string | null>(null);

    if (!primaryWallet || !isEthereumWallet(primaryWallet))
        return <>Must be connected to ethereum wallet.</>;

    const fetchBalance = async () => {
        try {
            const publicClient = await primaryWallet.getPublicClient();
            if (!publicClient) throw new Error("No public client available");

            const tokenContract = getContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                client: publicClient,
            });

            const balance = await tokenContract.read.balanceOf([primaryWallet.address]) as bigint;
            const decimals = await tokenContract.read.decimals() as number;
            const formattedBalance = formatUnits(balance, decimals);
            setBalance(formattedBalance.toString());
        } catch (error) {
            console.error("Error fetching balance:", error);
        }
    };

    return (
        <div>
            <p>Token Balance: {formattedBalance}</p>
            <button onClick={fetchBalance}>Fetch Balance</button>
        </div>
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
export { TokenLaunch, BuyWithSei, SellForSei, Balance };
