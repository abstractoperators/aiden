import { createResource, fromApiEndpoint, getResource } from "./common"
import { Runtime } from "./runtime"

const baseUrl = fromApiEndpoint('agents/')

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
// TODO: use Zod schema here
// TODO: generalize agent type and create an additional AgentDraft type
interface ClientAgent {
  id: string
  name: string
  ticker?: string
  marketCapitalization: number
  holderCount: number
}

interface AgentBase {
  eliza_agent_id?: string | null
  owner_id: string
  runtime_id?: string | null
  token_id?: string | null
  character_json: {
    name: string
  }
  env_file: string
}

interface Agent extends AgentBase {
  id: string
  runtime?: Runtime | null
  token?: Token | null
}

interface Token {
  ticker: string
}

async function getAgent(agentId: string): Promise<Agent> {
  return getResource<Agent>(baseUrl, { resourceId: agentId })
}

async function createAgent(agentPayload: AgentBase): Promise<Agent> {
  return createResource<Agent, AgentBase>(baseUrl, agentPayload)
}

async function getAgents(): Promise<Agent[]> {
  return getResource<Agent[]>(baseUrl)
}

async function getToken(tokenId: string): Promise<Token> {
  return getResource<Token>(
    fromApiEndpoint('tokens/'),
    { resourceId: tokenId },
  )
}

async function getEnlightened(): Promise<ClientAgent[]> {
  try {
    return Promise.all(
      (await getAgents())
      .map(async agent => {
        const clientAgent = {
          id: agent.id,
          name: agent.character_json.name,
          // TODO: retrieve financial stats via API
          marketCapitalization: 0,
          holderCount: 0,
        }

        return (agent.token_id) ? {
          ticker: (await getToken(agent.token_id)).ticker,
          ...clientAgent,
        } : clientAgent
      })
    )
  } catch (error) {
    // TODO: toast?
    console.error(error)
  }

  throw new Error("Logic error, this should never be reached.")
}

async function getIncubating(): Promise<ClientAgent[]> {
  // TODO: replace with API call
  return getEnlightened()
}

export {
  createAgent,
  getAgent,
  getEnlightened,
  getIncubating,
}

export type {
  ClientAgent,
  Agent,
  Token,
}