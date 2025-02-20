
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Agent, columns } from "./columns"

async function getLive(): Promise<Agent[]> {
  // TODO: replace with API call
  return [
    {
      name: "Kent",
      ticker: "POS",
      marketCapitalization: 1000000000,
      holderCount: 9001,
    },
    {
      name: "Michael",
      ticker: "SWOLE",
      marketCapitalization: 999999999,
      holderCount: 69,
    },
    {
      name: "Dance",
      ticker: "DANCE",
      marketCapitalization: 1000,
      holderCount: 420,
    },
  ]
}

async function getIncubating(): Promise<Agent[]> {
  // TODO: replace with API call
  return [
    {
      name: "Gang",
      ticker: "SOP",
      marketCapitalization: 1,
      holderCount: 3.14159,
    },
    {
      name: "Deng",
      ticker: "ELOWS",
      marketCapitalization: 2,
      holderCount: 42,
    },
    {
      name: "Ecnad",
      ticker: "ECNAD",
      marketCapitalization: 3,
      holderCount: 0,
    },
  ]
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