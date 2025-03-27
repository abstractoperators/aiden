'use server'

import {
  createResource,
  deleteResource,
  fromApiEndpoint,
  getResource,
  updateOrCreateResource,
  updateResource,
  UrlResourceNotFoundError,
} from "./common"

const WALLET_PATH = '/wallets'
const WALLET_SEGMENT = '/wallets/'

const baseUrlPath = fromApiEndpoint(WALLET_PATH)
const baseUrlSegment = fromApiEndpoint(WALLET_SEGMENT)

interface WalletUpdate {
  ownerId: string | null
}

interface WalletBase {
  publicKey: string
  chain?: string
  chainId?: number
  ownerId: string
}

interface Wallet extends WalletBase {
  id: string
}

async function getWallet(
  query: { publicKey: string, chain?: string } | { walletId: string }
): Promise<Wallet> {
  return getResource<Wallet>(
    baseUrlPath,
    { query: query },
  )
}

async function createWallet(wallet: WalletBase): Promise<Wallet> {
  return createResource(baseUrlPath, wallet)
}

async function updateWallet(walletId: string, walletUpdate: WalletUpdate): Promise<Wallet> {
  return updateResource(
    baseUrlSegment,
    walletId,
    walletUpdate,
  )
}

async function updateOrCreateWallet(
  id: { publicKey: string, chain?: string } | { walletId: string},
  walletUpdate: WalletUpdate,
  wallet: WalletBase,
): Promise<Wallet> {
  if ("walletId" in id) {
    return updateOrCreateResource({
      baseUpdateUrl: baseUrlSegment,
      resourceId: id.walletId,
      updateBody: walletUpdate,
      createUrl: baseUrlPath,
      createBody: wallet,
    })
  }

  return (
    getWallet(id)
    .then(apiWallet => (updateWallet(apiWallet.id, walletUpdate)))
    .catch((error) => {
      if (error instanceof UrlResourceNotFoundError) {
        return createWallet(wallet)
      } else {
        console.error(error)
        throw error
      }
    })
  )
}

async function deleteWallet(walletId: string) {
  return deleteResource(
    baseUrlSegment,
    walletId,
  )
}

export type {
  WalletBase,
  Wallet,
}

export {
  createWallet,
  deleteWallet,
  getWallet,
  updateWallet,
  updateOrCreateWallet,
}