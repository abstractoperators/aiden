'use server'

import { revalidatePath } from "next/cache"
import { createResource, fromApiEndpoint, getResource } from "./common"
import { Runtime } from "./runtime"
import { getToken, Token } from "./token"
import { AgentStartTask, TaskStatus } from "./task"
// TODO: remove when we have a better setup to start agents on runtimes, e.g. background process on client or queuing on API
import { setTimeout } from "node:timers/promises"

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
  elizaAgentId?: string | null
  ownerId: string
  runtimeId?: string | null
  tokenId?: string | null
  characterJson: {
    name: string
  }
  envFile: string
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

async function startAgent(agentId: string, runtimeId: string): Promise<AgentStartTask> {
  return createResource<AgentStartTask>(new URL(
    `${baseUrlPath.href}/${agentId}/start/${runtimeId}`
  ))
}

// TODO: update when endpoint is updated
async function getAgentStartTaskStatus(
  agentId: string,
  runtimeId: string,
  delay?: number,
): Promise<TaskStatus> {
  await setTimeout(delay)
  const baseUrl = fromApiEndpoint('/agents')
  return getResource<TaskStatus>(new URL(
    `${baseUrl.href}/${agentId}/start/${runtimeId}`,
  ))
}

async function getAgents(
  query?: { userId: string } | { userDynamicId: string }
): Promise<Agent[]> {
  return getResource<Agent[]>(
    baseUrlSegment,
    query ? { query: query } : undefined,
  )
}

async function getEnlightened(
  query?: (
    { userId: string } |
    { userDynamicId: string }
  )
): Promise<ClientAgent[]> {
  try {
    const apiAgents = (!query) ? getAgents() : getAgents(query)

    return Promise.all(
      (await apiAgents)
      .map(async agent => {
        const clientAgent = {
          id: agent.id,
          name: agent.characterJson.name || "Nameless",
          ownerId: agent.ownerId,
          // TODO: retrieve financial stats via API
          marketCapitalization: 0,
          holderCount: 0,
        }

        return (agent.tokenId) ? {
          ticker: (await getToken(agent.tokenId)).ticker,
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
  getAgentStartTaskStatus,
  startAgent,
}

export type {
  ClientAgent,
  Agent,
  Token,
}