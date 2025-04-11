"use server"
import { fromApiEndpoint, getResource } from "./common"
import { createResource } from "./common"
import { Result } from "./result"

const TOKEN_SEGMENT = '/tokens/'
const TOKEN_PATH = "/tokens"

const baseUrlSegment = fromApiEndpoint(TOKEN_SEGMENT)
const baseUrlPath = fromApiEndpoint(TOKEN_PATH)

interface TokenBase {
  ticker: string
  name: string
  evmContractAddress: `0x${string}`
  abi: object[]
}
interface TokenCreationRequest {
  name: string
  ticker: string
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

async function createToken(tokenPayload: TokenCreationRequest): Promise<Result<Token>> {
  return createResource<Token, TokenCreationRequest>(baseUrlPath, tokenPayload)
}

async function getTokens(): Promise<Result<Token[]>> {
  return getResource<Token[]>({
    baseUrl: baseUrlPath,
  })
};

export {
  getToken,
  saveToken,
  createToken,
  getTokens
}

export type {
  Token,
}