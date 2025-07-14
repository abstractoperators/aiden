import { z } from "zod";

export const EnvSchema = z.object({
  env: z.object({
    key: z.string().trim(),
    value: z.string().trim(),
  }).array(),
})

export type EnvSchema = z.infer<typeof EnvSchema>