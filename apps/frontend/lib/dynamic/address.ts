import type { Wallet } from "@dynamic-labs/sdk-react-core";

function getEthSeiAddresses(
  wallets: Wallet[],
): {
  ethAddress: string | undefined,
  seiAddress: string | undefined,
} {
  const ethWallet = wallets.find(wallet =>
    wallet.chain === "EVM"
  )

  const seiAddress = (
    ethWallet?.additionalAddresses.find(addAddr =>
      addAddr.address.startsWith("sei1")
    ) ?? wallets.find(wallet =>
      wallet.address.startsWith("sei1")
    )
  )?.address

  return { ethAddress: ethWallet?.address, seiAddress }
}

export {
  getEthSeiAddresses,
}