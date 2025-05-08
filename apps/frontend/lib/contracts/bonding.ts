import { Wallet } from "@dynamic-labs/sdk-react-core";
import BONDING_JSON from "./abis/bonding.json"
import ERC20_JSON from "./abis/ferc20.json"
import {
  getContract,
  parseEther,
  parseEventLogs,
  PublicClient,
  WalletClient,
} from "viem";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { z } from "zod";
import { saveToken, Token } from "../api/token";
import { isErrorResult, Result } from "../api/result";

const BONDING_CONTRACT_ADDRESS: `0x${string}` = process.env.NEXT_PUBLIC_BONDING_CONTRACT_ADDRESS as `0x${string}` ?? "0x"
const BONDING_ABI = BONDING_JSON.abi
const ERC20_ABI = ERC20_JSON.abi

function getBondingContract( client: {
  public: PublicClient,
  wallet: WalletClient,
}) {
  console.debug(BONDING_CONTRACT_ADDRESS)
  return getContract({
    address: BONDING_CONTRACT_ADDRESS,
    abi: BONDING_ABI,
    client
  })
}

async function getClientFromWallet(wallet: Wallet | null) {
  if (!wallet || !isEthereumWallet(wallet))
    throw new Error(`Wallet ${wallet} does not exist or is not an ethereum wallet!`)

  return {
    wallet: await wallet.getWalletClient(),
    public: await wallet.getPublicClient(),
  }
}

async function buyWithSei({
  tokenAddress: address,
  seiAmount,
  primaryWallet: wallet,
}: {
  tokenAddress: `0x${string}`,
  seiAmount: number,
  primaryWallet: Wallet | null,
}) {
  const client = await getClientFromWallet(wallet)
  const contract = getBondingContract(client)

  const hash = await contract.write.buyWithSei(
    [address],
    { value: parseEther(seiAmount.toString()) }
  )

  return client.public.waitForTransactionReceipt({
    hash,
    confirmations: 1,
  })
}

async function sellForSei({
  tokenAddress: address,
  tokenAmount: amount,
  primaryWallet: wallet,
}: {
  tokenAddress: `0x${string}`,
  tokenAmount: number,
  primaryWallet: Wallet | null,
}) {
  const client = await getClientFromWallet(wallet)
  const bondingContract = getBondingContract(client)
  const tokenContract = getContract({
    address,
    abi: ERC20_ABI,
    client,
  })

  const parsedAmount = parseEther(amount.toString())
  const approveHash = await tokenContract.write.approve(
    [BONDING_CONTRACT_ADDRESS, parsedAmount],
    {
        gasLimit: 100000,
    }
  );
  await client.public.waitForTransactionReceipt({
    hash: approveHash,
    confirmations: 1,
  });
  const buyHash = await bondingContract.write.sellForSei(
    [parsedAmount, address],
  );

  return client.public.waitForTransactionReceipt({
    hash: buyHash,
    confirmations: 1,
  });
}

const launchSchema = z.object({
  tokenName: z.string().min(1, "Name cannot be empty"),
  ticker: z.string().min(1, "Ticker cannot be empty"),
})
type LaunchSchemaType = z.infer<typeof launchSchema>

function launchTokenFactory(wallet: Wallet | null) {
  async function launchToken({
    tokenName: name,
    ticker,
  }: LaunchSchemaType): Promise<Result<Token>> {
    const client = await getClientFromWallet(wallet)
    const contract = getBondingContract(client)

    const fee = await contract.read.assetLaunchFee() as bigint;
    console.debug("Launch Fee:", fee);

    const simulation = await contract.simulate.launchWithSei(
      [name, ticker],
      { value: fee },
    );
    console.debug("Launch Simulation:", simulation)

    const hash = await contract.write.launchWithSei(
      [name, ticker],
      { value: fee },
    );
    console.debug("Launch Hash:", hash)

    const receipt = await client.public.waitForTransactionReceipt({
        hash,
        confirmations: 1,
    });

    const events = parseEventLogs({
        abi: BONDING_ABI,
        logs: receipt.logs,
        eventName: "Launched",
    });
    if (events.length === 0) {
        throw new Error("No Launched event found in transaction receipt");
    }
    if (events.length > 1) {
        console.warn("Multiple Launched events found in transaction receipt");
    }

    // @ts-expect-error it's because I didn't want to make my own type and find the Log type from which LaunchedEvent inherits, and .args doesn't exist on the Log type by default but istg it does on the Launched Event.
    const tokenAddress = events[0].args[0] as `0x${string}`;
    console.debug("Token launched at:", tokenAddress);

    const tokenPayload = {
        name,
        ticker,
        evmContractAddress: tokenAddress,
        abi: ERC20_ABI, // maybe we stop saving an abi for each token - dunno.
    };

    return saveToken(tokenPayload)
  }

  return launchToken
}

export {
  getBondingContract,
  buyWithSei,
  launchSchema,
  launchTokenFactory,
  sellForSei,
}

export type {
  LaunchSchemaType,
}