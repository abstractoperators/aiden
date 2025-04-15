'use server'

import { revalidatePath } from "next/cache"
import {
  createResource,
  deleteResource,
  fromApiEndpoint,
  getResource,
  updateResource,
} from "./common"
import { getRuntime, Runtime } from "./runtime"
import { Token } from "./token"
import { AgentStartTask, TaskStatus } from "./task"
// TODO: remove when we have a better setup to start agents on runtimes, e.g. background process on client or queuing on API
import { setTimeout } from "node:timers/promises"
import { Character } from "@/lib/character"
import {
  createSuccessResult,
  isBadRequest,
  isErrorResult,
  Result,
} from "./result"

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
  characterJson: Character
  envFile: string
}

type AgentUpdate = Partial<AgentBase>

interface Agent {
  id: string
  runtime?: Runtime | null
  token?: Token | null
  envFile: { key: string, value: string | null }[]
  elizaAgentId?: string | null
  ownerId: string
  runtimeId?: string | null
  tokenId?: string | null
  characterJson: Character
}

async function getAgent(agentId: string): Promise<Result<Agent>> {
  return getResource<Agent>({
    baseUrl: baseUrlSegment,
    resourceId: agentId,
  })
}

async function createAgent(
  agentPayload: AgentBase,
): Promise<Result<Agent>> {
  const ret = createResource<Agent, AgentBase>(baseUrlPath, agentPayload)
  revalidatePath(AGENT_PATH)
  return ret
}

async function startAgent({
  agentId,
  runtimeId,
  maxTries = 10,
}: {
  agentId: string,
  runtimeId?: string,
  maxTries?: number,
}): Promise<Result<AgentStartTask>> {
  if (!runtimeId) {
    const runtime = await getRuntime()
    if (isErrorResult(runtime)) {
      return runtime
    } else {
      runtimeId = runtime.data.id
    }
  }

  const result = await createResource<AgentStartTask>(new URL(
    `${baseUrlPath.href}/${agentId}/start/${runtimeId}`
  ))

  if (isBadRequest(result)) {
    if (result.message.includes("task for runtime")) { // we picked a bad runtime
      console.debug(`Unable to start agent ${agentId} on runtime ${runtimeId}`)
      // this could loop indefinitely if runtimes are perpetually unavailable, so we limit the number of tries
      if (maxTries > 0) {
        console.debug(`Trying a new runtime`)
        return startAgent({ agentId, maxTries: maxTries - 1})
      }
    } else { // agent is already starting but we don't know the runtime
      return createSuccessResult({ agentId })
    }
  }

  return result
}

async function stopAgent(agentId: string): Promise<Result<Agent>> {
  return createResource<Agent>(new URL(
    `${baseUrlPath.href}/${agentId}/stop`
  ))
}

async function getAgentStartTaskStatus(
  query: {
    agentId: string,
  } | {
    runtimeId: string,
  } | {
    agentId: string,
    runtimeId: string,
  },
  delay?: number,
): Promise<Result<TaskStatus>> {
  await setTimeout(delay)
  return getResource<TaskStatus>({
    baseUrl: fromApiEndpoint('/tasks/start-agent'),
    query,
  })
}

async function getAgents(
  query?: { userId: string } | { userDynamicId: string }
): Promise<Result<Agent[]>> {
  return getResource<Agent[]>({
    baseUrl: baseUrlSegment,
    query,
  })
}

async function getEnlightened(
  query?: (
    { userId: string } |
    { userDynamicId: string }
  )
): Promise<Result<ClientAgent[]>> {
  const apiAgents = await getAgents(query)

  return (isErrorResult(apiAgents)) ? apiAgents : {
    status: apiAgents.status,
    data: apiAgents.data.map(agent => ({
      id: agent.id,
      name: agent.characterJson.name || agent.id,
      ownerId: agent.ownerId,
      // TODO: retrieve financial stats via API
      marketCapitalization: 0,
      holderCount: 0,
      ticker: agent.token?.ticker,
    }))
  }
}

async function getIncubating(
  query?: (
    { userId: string } |
    { userDynamicId: string }
  )
): Promise<Result<ClientAgent[]>> {
  // TODO: replace with Incubating version
  return getEnlightened(query)
}

async function updateAgent(agentId: string, agentUpdate: AgentUpdate): Promise<Result<Agent>> {
  const ret = updateResource<Agent, AgentUpdate>({
    baseUrl: baseUrlSegment,
    resourceId: agentId,
    body: agentUpdate
  })
  revalidatePath(AGENT_PATH)
  return ret
}

async function deleteAgent(agentId: string) {
  return deleteResource(
    baseUrlSegment,
    agentId,
  )
}

export {
  createAgent,
  deleteAgent,
  getAgent,
  getEnlightened,
  getIncubating,
  getAgentStartTaskStatus,
  startAgent,
  stopAgent,
  updateAgent,
}

export type {
  ClientAgent,
  Agent,
  Token,
}