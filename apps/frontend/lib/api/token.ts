import { fromApiEndpoint, getResource } from "./common"

const TOKEN_SEGMENT = '/tokens/'

const baseUrlSegment = fromApiEndpoint(TOKEN_SEGMENT)

interface TokenBase {
  ticker: string
  name: string
  evmContractAddress: string
  abi: object[]
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

export {
  getToken,
}

export type {
  Token,
}