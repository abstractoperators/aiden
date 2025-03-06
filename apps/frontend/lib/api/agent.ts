import { fromApiEndpoint, getResource } from "./common"
import { Runtime } from "./runtime"

const baseUrl = fromApiEndpoint('agents/')

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
// TODO: use Zod schema here
// TODO: generalize agent type and create an additional AgentDraft type
interface Agent {
  id: string
  name: string
  ticker?: string
  marketCapitalization: number
  holderCount: number
}

interface ApiAgent {
  id: string
  eliza_agent_id: string | null
  owner_id: string
  runtime?: Runtime | null
  runtime_id: string | null
  token?: ApiToken | null
  token_id: string | null
  character_json: {
    name: string
  }
}

interface ApiToken {
  ticker: string
}

async function getAgent(agentId: string): Promise<ApiAgent> {
  return await getResource<ApiAgent>(baseUrl, { resourceId: agentId })
}

async function getAgents(): Promise<ApiAgent[]> {
  return await getResource<ApiAgent[]>(baseUrl)
}

async function getToken(tokenId: string): Promise<ApiToken> {
  return await getResource<ApiToken>(
    fromApiEndpoint('tokens/'),
    { resourceId: tokenId },
  )
}

async function getEnlightened(): Promise<Agent[]> {
  try {
    return Promise.all(
      (await getAgents())
      .map(async apiAgent => {
        const agent = {
          id: apiAgent.id,
          name: apiAgent.character_json.name,
          // TODO: retrieve financial stats via API
          marketCapitalization: 0,
          holderCount: 0,
        }

        return (apiAgent.token_id) ? {
          ticker: (await getToken(apiAgent.token_id)).ticker,
          ...agent,
        } : agent
      })
    )
  } catch (error) {
    // TODO: toast?
    console.error(error)
  }

  throw new Error("Logic error, this should never be reached.")
}

async function getIncubating(): Promise<Agent[]> {
  // TODO: replace with API call
  return getEnlightened()
}

export {
  baseUrl,
  getAgent,
  getEnlightened,
  getIncubating,
}

export type {
  Agent,
  ApiAgent,
  ApiToken,
}