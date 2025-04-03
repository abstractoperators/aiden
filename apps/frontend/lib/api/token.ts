"use server"
import { fromApiEndpoint, getResource } from "./common"
import { createResource } from "./common"
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

async function getToken(tokenId: string): Promise<Token> {
  return getResource<Token>({
    baseUrl: baseUrlSegment,
    resourceId: tokenId,
  })
}

async function saveToken(tokenPayload: TokenBase): Promise<Token> {
  return createResource<Token, TokenBase>(new URL(`${baseUrlPath.href}/save`), tokenPayload)
}

async function createToken(tokenPayload: TokenCreationRequest): Promise<Token> {
  return createResource<Token, TokenCreationRequest>(baseUrlPath, tokenPayload)
}

export {
  getToken,
  saveToken,
  createToken,
}

export type {
  Token,
}