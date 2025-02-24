
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Agent, columns } from "./columns"

async function getLive(): Promise<Agent[]> {
  // TODO: replace with API call
  return [
    {
      name: "Kent",
      ticker: "KENT",
      marketCapitalization: 0,
      holderCount: 0,
    },
  ]
}

async function getIncubating(): Promise<Agent[]> {
  // TODO: replace with API call
  return []
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