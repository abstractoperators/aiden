import { Wallet } from "@dynamic-labs/sdk-react-core";
import BONDING_JSON from "./abis/bonding.json"
import ERC20_JSON from "./abis/ferc20.json"
import {
  getContract,
  parseEther,
  PublicClient,
  WalletClient,
} from "viem";
import { isEthereumWallet } from "@dynamic-labs/ethereum";

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

export {
  getBondingContract,
  buyWithSei,
  sellForSei,
}