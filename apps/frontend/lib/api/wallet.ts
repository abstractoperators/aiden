'use server'

import { createResource, deleteResource, fromApiEndpoint, getResource, updateResource } from "./common"

const WALLET_PATH = '/wallets'
const WALLET_SEGMENT = '/wallets/'

const baseUrlPath = fromApiEndpoint(WALLET_PATH)
const baseUrlSegment = fromApiEndpoint(WALLET_SEGMENT)

interface WalletUpdate {
  owner_id: string | null
}

interface WalletBase {
  public_key: string
  chain?: string
  chain_id?: number
  owner_id: string
}

interface Wallet extends WalletBase {
  id: string
}

async function getWallet(query: {public_key: string}): Promise<Wallet>
async function getWallet(query: {wallet_id: string}): Promise<Wallet>
async function getWallet(query: {
  public_key: string,
} | {
  wallet_id: string,
}): Promise<Wallet> {
  return getResource<Wallet>(
    baseUrlPath,
    { query: new URLSearchParams(query) },
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
}