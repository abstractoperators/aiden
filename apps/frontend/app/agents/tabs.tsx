
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Agent, columns } from "./columns"

interface ApiAgent {
  id: string
  owner_id: string
  runtime_id: string
  token_id: string
  character_json: {
    name: string
  }
}

interface ApiToken {
  id: string
  ticker: string
  name: string
  evm_contract_address: string
}

interface ApiRuntime {
  id: string
  started: boolean
  url: string
}

async function getAgents(): Promise<ApiAgent[]> {
  try {
    const response = await fetch(
      new URL("/agents", process.env.API_ENDPOINT),
    )

    if (!response.ok) throw new Error("Failed to retrieve agents")

    return await response.json()
  } catch (error) {
    console.error(error)
  }

  throw new Error("Logic error, this should never be reached.")
}

async function getToken(token_id: string): Promise<ApiToken> {
  try {
    const response = await fetch(
        new URL(`/tokens/${token_id}`, process.env.API_ENDPOINT),
    )

    if (!response.ok) throw new Error(`Failed to retrieve token ${token_id}`)

    return await response.json()
  } catch (error) {
    console.error(error)
  }

  throw new Error("Logic error, this should never be reached.")
}

async function getRuntimes(): Promise<ApiRuntime[]> {
  try {
    const response = await fetch(
      new URL("/runtimes", process.env.API_ENDPOINT),
    )

    if (!response.ok) throw new Error("Failed to retrieve runtimes")

    return await response.json()
  } catch (error) {
    console.error(error)
  }

  throw new Error("Logic error, this should never be reached.")
}

async function getLive(): Promise<Agent[]> {
  try {
    const apiAgents = await getAgents()
    const tokens = await Promise.allSettled(apiAgents.map(
      agent => getToken(agent.token_id)
    )).then(
      results => results.map(
        result => result.status == "fulfilled" ? result.value.name : ""
      )
    )
    const runTimes = Object.fromEntries((await getRuntimes())
      .map(runtime =>[
        runtime.id, 
        runtime,
      ])
    )

    return apiAgents.map((agent, i) => ({
      name: agent.character_json.name,
      ticker: tokens[i],
      runtimeUrl: runTimes[agent.runtime_id].url,
      // TODO: retrieve financial stats via API
      marketCapitalization: 0,
      holderCount: 0,
    }))
  } catch (error) {
    // TODO: toast?
    console.error(error)
  }

  throw new Error("Logic error, this should never be reached.")
}

async function getIncubating(): Promise<Agent[]> {
  // TODO: replace with API call
  return getLive()
}

export default async function AgentsTabs() {
  const live = await getLive()
  const incubating = await getIncubating()

  return (
    <Tabs defaultValue="live">
      <TabsList>
        <TabsTrigger value="live">Live</TabsTrigger>
        <TabsTrigger value="incubating">Incubating</TabsTrigger>
      </TabsList>
      <TabsContent value="live">
        <DataTable columns={columns} data={live} />
      </TabsContent>
      <TabsContent value="incubating">
        <DataTable columns={columns} data={incubating} />
      </TabsContent>
    </Tabs>
  )
}