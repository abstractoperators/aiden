import { z } from "zod";

const stringListSchema = z.object({
  bio: z.string().trim().min(2, "Cannot be empty").array().min(1),
  lore: z.string().trim().min(2, "Cannot be empty").array(),
  knowledge: z.string().trim().min(2, "Cannot be empty").array().optional(),
  postExamples: z.string().trim().min(2, "Cannot be empty").array(),
  adjectives: z.string().trim().min(2, "Cannot be empty").array(),
  topics: z.string().trim().min(2, "Cannot be empty").array(),
})

const characterSchema = z.object({
  name: z.string().trim().min(1, "Cannot be empty"),
  messageExamples: z.object({
    user: z.string().trim().min(1, "Cannot be empty"),
    content: z.object({
      text: z.string().trim().min(1, "Cannot be empty"),
      action: z.string().trim().min(1, "Cannot be empty").optional(),
    })
  }).array().array(),
  style: z.object({
    all: z.string().trim().min(2, "Cannot be empty").array(),
    chat: z.string().trim().min(2, "Cannot be empty").array(),
    post: z.string().trim().min(2, "Cannot be empty").array(),
  }),
}).merge(stringListSchema)

interface Character {
  name: string
  clients: string[]
  modelProvider: string
  settings?: {
    secrets?: Record<string, string>
  }
  plugins: string[]
  bio: string[]
  lore: string[]
  knowledge?: string[]
  messageExamples: {
    user: string
    content: {
      text: string
      action?: string
    }
  }[][]
  postExamples: string[]
  adjectives: string[]
  topics: string[]
  style: {
    all: string[]
    chat: string[]
    post: string[]
  }
}

export {
  characterSchema,
}

export type {
  Character,
}