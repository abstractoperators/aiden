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
  runtime?: ApiRuntime | null
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

interface ApiRuntime {
  url: string
}

async function getResource<T>(
  route: string,
  resource_id?: string,
): Promise<T> {
  try {
    const routeAndBase = new URL(route, process.env.API_ENDPOINT)
    const url = resource_id ? new URL(resource_id, routeAndBase) : routeAndBase

    const response = await fetch(url);

    if (!response.ok)
      throw new Error(`Failed to retrieve ${url}`)

    return await response.json()
  } catch (error) {
    console.error(error)
  }
  throw new Error("Logic error, this should never be reached.")
}

async function getAgent(agent_id: string): Promise<ApiAgent> {
  return await getResource<ApiAgent>('agents/', agent_id)
}

async function getAgents(): Promise<ApiAgent[]> {
  return await getResource<ApiAgent[]>('agents')
}

async function getToken(token_id: string): Promise<ApiToken> {
  return await getResource<ApiToken>('tokens/', token_id)
}

async function getRuntime(runtime_id: string): Promise<ApiRuntime> {
  return await getResource<ApiRuntime>('runtimes/', runtime_id)
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
  getAgent,
  getEnlightened,
  getIncubating,
  getRuntime,
}

export type {
  Agent,
  ApiAgent,
  ApiToken,
  ApiRuntime,
}