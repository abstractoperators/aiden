import { z } from "zod";

enum ModelProviderName {
    OPENAI = "openai",
    ETERNALAI = "eternalai",
    ANTHROPIC = "anthropic",
    GROK = "grok",
    GROQ = "groq",
    LLAMACLOUD = "llama_cloud",
    TOGETHER = "together",
    LLAMALOCAL = "llama_local",
    GOOGLE = "google",
    MISTRAL = "mistral",
    CLAUDE_VERTEX = "claude_vertex",
    REDPILL = "redpill",
    OPENROUTER = "openrouter",
    OLLAMA = "ollama",
    HEURIST = "heurist",
    GALADRIEL = "galadriel",
    FAL = "falai",
    GAIANET = "gaianet",
    ALI_BAILIAN = "ali_bailian",
    VOLENGINE = "volengine",
    NANOGPT = "nanogpt",
    HYPERBOLIC = "hyperbolic",
    VENICE = "venice",
    NINETEEN_AI = "nineteen_ai",
    AKASH_CHAT_API = "akash_chat_api",
    LIVEPEER = "livepeer",
    LETZAI = "letzai",
    DEEPSEEK="deepseek",
    INFERA="infera"
}
const ModelProviderNameEnum = z.nativeEnum(ModelProviderName)
type ModelProviderNameEnum = z.infer<typeof ModelProviderNameEnum>

enum Clients {
    DISCORD = "discord",
    DIRECT = "direct",
    TWITTER = "twitter",
    TELEGRAM = "telegram",
    FARCASTER = "farcaster",
    LENS = "lens",
    AUTO = "auto",
    SLACK = "slack",
    GITHUB = "github",
    TWITTERMILLI = "twitter-milli"
}
const ClientsEnum = z.nativeEnum(Clients)
type ClientsEnum = z.infer<typeof ClientsEnum>

const CharacterSchema = z.object({
  name: z.string().trim().min(1, "Cannot be empty"),
  clients: ClientsEnum.array(),
  modelProvider: ModelProviderNameEnum,
  settings: z.object({
    secrets: z.object({}).catchall(z.string().trim()).optional(),
  }).optional(),
  plugins: z.string().trim().startsWith("@elizaos/plugin-").array(),
  bio: z.string().trim().min(4, "Cannot be empty").array().min(1),
  lore: z.string().trim().min(1, "Cannot be empty").array(),
  knowledge: z.string().trim().min(1, "Cannot be empty").array().optional(),
  messageExamples: z.object({
    user: z.string().trim().min(1, "Cannot be empty"),
    content: z.object({
      text: z.string().trim().min(1, "Cannot be empty"),
      action: z.string().trim().min(1, "Cannot be empty").optional(),
    })
  }).array().array(),
  postExamples: z.string().trim().min(1, "Cannot be empty").array(),
  adjectives: z.string().trim().min(1, "Cannot be empty").array(),
  topics: z.string().trim().min(1, "Cannot be empty").array(),
  style: z.object({
    all: z.string().trim().min(2, "Cannot be empty").array(),
    chat: z.string().trim().min(2, "Cannot be empty").array(),
    post: z.string().trim().min(2, "Cannot be empty").array(),
  }),
})
type Character = z.infer<typeof CharacterSchema>


export {
  CharacterSchema,
  Clients,
  ModelProviderName,
}

export type {
  Character,
}