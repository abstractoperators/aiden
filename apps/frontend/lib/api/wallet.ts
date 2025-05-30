'use server'

import {
  createResource,
  deleteResource,
  fromApiEndpoint,
  getResource,
  updateOrCreateResource,
  updateResource,
} from "./common"
import { Result, isErrorResult, isNotFound } from "./result"

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
): Promise<Result<Wallet>> {
  return getResource<Wallet>({
    baseUrl: baseUrlPath,
    query,
  })
}

async function createWallet(wallet: WalletBase): Promise<Result<Wallet>> {
  return createResource(baseUrlPath, wallet)
}

async function updateWallet(
  walletId: string,
  walletUpdate: WalletUpdate,
): Promise<Result<Wallet>> {
  return updateResource({
    baseUrl: baseUrlSegment,
    resourceId: walletId,
    body: walletUpdate,
  })
}

async function updateOrCreateWallet(
  id: { publicKey: string, chain?: string } | { walletId: string},
  walletUpdate: WalletUpdate,
  wallet: WalletBase,
): Promise<Result<Wallet>> {
  if ("walletId" in id) {
    return updateOrCreateResource({
      baseUpdateUrl: baseUrlSegment,
      resourceId: id.walletId,
      updateBody: walletUpdate,
      createUrl: baseUrlPath,
      createBody: wallet,
    })
  }

  const apiWallet = await getWallet(id)
  if (isErrorResult(apiWallet)) {
    return isNotFound(apiWallet) ? createWallet(wallet) : apiWallet
  }
  
  return updateWallet(
    apiWallet.data.id,
    walletUpdate,
  ).then(result => (
    ( isNotFound(result) )
    ? createWallet(wallet)
    : result
  ))
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