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
    DEEPSEEK = "deepseek",
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

const filterEmptyStrings = (arr: string[]) => arr.filter(str => str !== '')
const FilteredStringArraySchema = z.string().trim().array().transform(filterEmptyStrings)

const CharacterSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty"),
  clients: ClientsEnum.array(),
  modelProvider: ModelProviderNameEnum,
  settings: z.object({
    secrets: z.object({}).catchall(z.string().trim()).optional(),
  }).optional(),
  plugins: FilteredStringArraySchema.refine(
    arr => {
      const pluginPrefix = "@elizaos/plugin-"
      return arr.every(str => (
        str.startsWith(pluginPrefix) &&
        str.length > pluginPrefix.length
      ))
    },
    "Any valid plugin must start with \"@elizaos/plugin-\"",
  ),
  bio: FilteredStringArraySchema.refine(
    arr => arr.length > 0,
    "The biography must have at least one nonempty entry",
  ),
  lore: FilteredStringArraySchema,
  knowledge: FilteredStringArraySchema.optional(),
  messageExamples: z.object({ // TODO: filter out empty objects
    user: z.string().trim().min(1, "The user in a message example cannot be empty"),
    content: z.object({
      text: z.string().trim().min(1, "The content text in a message example cannot be empty"),
      action: z.preprocess(
        arg => (typeof arg === 'string' && arg === '' ? undefined : arg),
        z.string().trim().optional(),
      ),
    }).strict()
  }).strict().array().array().transform(arr => arr.filter(subArray => subArray.length > 0)),
  postExamples: FilteredStringArraySchema,
  adjectives: FilteredStringArraySchema,
  topics: FilteredStringArraySchema,
  style: z.object({
    all: FilteredStringArraySchema,
    chat: FilteredStringArraySchema,
    post: FilteredStringArraySchema,
  }).strict(),
}).strict()
type Character = z.infer<typeof CharacterSchema>

export {
  CharacterSchema,
  Clients,
  ModelProviderName,
}

export type {
  Character,
}