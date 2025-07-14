"use server"
import { fromApiEndpoint, getResource } from "./common"
import { createResource } from "./common"
import { Result } from "./result"

const TOKEN_SEGMENT = "/tokens/"
const TOKEN_PATH = "/tokens"

const baseUrlSegment = fromApiEndpoint(TOKEN_SEGMENT)
const baseUrlPath = fromApiEndpoint(TOKEN_PATH)

interface TokenBase {
  ticker: string
  name: string
  evmContractAddress: `0x${string}`
  abi: object[]
}
interface TokenMarketDataBase {
  name: string
  ticker: string
  description: string
}

interface TokenMarketData extends TokenMarketDataBase {
  exchange: string
  hasIntraday: boolean
  format: string
  listedExchange: string
  minmov: number
  pricescale: number
  session: string
  ticker: string
  timezone: string
  type: string
}

interface Token extends TokenBase {
  id: string
}

async function getToken(tokenId: string): Promise<Result<Token>> {
  return getResource<Token>({
    baseUrl: baseUrlSegment,
    resourceId: tokenId,
  })
}

async function saveToken(tokenPayload: TokenBase): Promise<Result<Token>> {
  return createResource<Token, TokenBase>(new URL(`${baseUrlPath.href}/save`), tokenPayload)
}

async function createMarketDataToken(
  tokenPayload: TokenMarketDataBase
): Promise<Result<TokenMarketData>> {
  return createResource<TokenMarketData, TokenMarketDataBase>(
    new URL('/symbols', process.env.NEXT_PUBLIC_MARKET_DATA_URL),
    tokenPayload,
  )
}

async function getTokens(): Promise<Result<Token[]>> {
  return getResource<Token[]>({
    baseUrl: baseUrlPath,
  })
};

export {
  createMarketDataToken,
  getToken,
  getTokens,
  saveToken,
}

export type {
  Token,
  TokenBase,
}