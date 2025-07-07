import { z } from "zod"

const LaunchTokenSchema = z.object({
  tokenName: z.string().min(1, "Name cannot be empty"),
  ticker: z.string().min(1, "Ticker cannot be empty"),
})
type LaunchTokenSchema = z.infer<typeof LaunchTokenSchema>

const NewTokenSchema = LaunchTokenSchema.extend({
  isNewToken: z.literal(true),
})

const ExistingTokenSchema = z.object({
  isNewToken: z.literal(false),
  tokenId: z.string(),
})

const TokenSchema = z.discriminatedUnion(
  "isNewToken", [
  NewTokenSchema,
  ExistingTokenSchema,
])

export {
  LaunchTokenSchema,
  TokenSchema,
}