'use server'

import { revalidatePath } from "next/cache"
import { createResource, fromApiEndpoint, getResource } from "./common"
import { Runtime } from "./runtime"
import { getToken, Token } from "./token"

const AGENT_PATH = '/agents'
const AGENT_SEGMENT = '/agents/'

const baseUrlSegment = fromApiEndpoint(AGENT_SEGMENT)
const baseUrlPath = fromApiEndpoint(AGENT_PATH)

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
// TODO: use Zod schema here
// TODO: generalize agent type and create an additional AgentDraft type
interface ClientAgent {
  id: string
  name: string
  ownerId: string
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

async function getAgent(agentId: string): Promise<Agent> {
  return getResource<Agent>(baseUrlSegment, { resourceId: agentId })
}

async function createAgent(agentPayload: AgentBase): Promise<Agent> {
  const ret = createResource<Agent, AgentBase>(baseUrlPath, agentPayload)
  revalidatePath(AGENT_PATH)
  return ret
}

async function startAgent(agentId: string, runtimeId: string): Promise<[ Agent, Runtime ]> {
  return createResource<[ Agent, Runtime ]>(new URL(
    `${baseUrlPath.href}/${agentId}/start/${runtimeId}`
  ))
}

async function getAgents(): Promise<Agent[]>
async function getAgents(query: {user_id: string}): Promise<Agent[]>
async function getAgents(query: {user_dynamic_id: string}): Promise<Agent[]>
async function getAgents(query?: {
  user_id: string,
} | {
  user_dynamic_id: string,
}): Promise<Agent[]> {
  return getResource<Agent[]>(
    baseUrlSegment,
    (query) ? { query: new URLSearchParams(query) } : {},
  )
}

async function getEnlightened(): Promise<ClientAgent[]>
async function getEnlightened(query: {user_id: string}): Promise<ClientAgent[]>
async function getEnlightened(query: {user_dynamic_id: string}): Promise<ClientAgent[]>
async function getEnlightened(query?: {
  user_id: string,
} | {
  user_dynamic_id: string,
}): Promise<ClientAgent[]> {
  try {
    // TODO: this is so goofy
    const apiAgents = (!query) ? getAgents() : ("user_id" in query) ? getAgents(query) : getAgents(query)

    return Promise.all(
      (await apiAgents)
      .map(async agent => {
        const clientAgent = {
          id: agent.id,
          name: agent.character_json.name,
          ownerId: agent.owner_id,
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
  startAgent,
}

export type {
  ClientAgent,
  Agent,
  Token,
}