import { Chain, createPublicClient, http } from "viem"
import { Wallet } from "@dynamic-labs/sdk-react-core"
import { isEthereumWallet } from "@dynamic-labs/ethereum"
import { sei, seiTestnet } from "viem/chains"

async function getClientFromWallet(wallet: Wallet | null) {
  if (!wallet || !isEthereumWallet(wallet))
    throw new Error(`Wallet ${wallet} does not exist or is not an ethereum wallet!`)

  return {
    wallet: await wallet.getWalletClient(),
    public: await wallet.getPublicClient(),
  }
}

function getSeiNet(): Chain {
  switch (process.env.NEXT_SEI_NET) {
    case "main":
      return sei
    case "test":
    default:
      return seiTestnet
  }
}

function getPublicClient() {
  return createPublicClient({
    chain: getSeiNet(),
    transport: http(),
  })
}

export {
  getClientFromWallet,
  getPublicClient,
}