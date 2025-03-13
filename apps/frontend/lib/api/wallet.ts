interface WalletBase {
  public_key: string
  chain?: string
  chain_id?: number
  owner_id: string
}

export type {
  WalletBase
}