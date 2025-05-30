import { isEthereumWallet } from "@dynamic-labs/ethereum"
import { Wallet } from "@dynamic-labs/sdk-react-core"
import ERC20_JSON from "./abis/ferc20.json"
import { formatUnits, getContract } from "viem"

const ERC20_ABI = ERC20_JSON.abi

async function getTokenBalance({
  address,
  primaryWallet: wallet,
}: {
  address: `0x${string}`,
  primaryWallet: Wallet | null,
}) {
  if (!wallet || !isEthereumWallet(wallet))
    throw new Error(`Wallet ${wallet} does not exist or is not an ethereum wallet!`)

  const client = await wallet.getPublicClient()
  const contract = getContract({
    address,
    abi: ERC20_ABI,
    client,
  })

  const balance = await contract.read.balanceOf([wallet.address]) as bigint
  const decimals = await contract.read.decimals() as number

  return formatUnits(balance, decimals)
}

export {
  getTokenBalance,
}