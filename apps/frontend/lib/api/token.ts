import { fromApiEndpoint, getResource } from "./common"

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
  return getResource<Token>(
    fromApiEndpoint('tokens/'),
    { resourceId: tokenId },
  )
}

export {
  getToken,
}

export type {
  Token,
}