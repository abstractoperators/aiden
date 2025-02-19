import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Agent, columns } from "./columns"

async function getPublished(): Promise<Agent[]> {
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

async function getDrafts(): Promise<Agent[]> {
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

export default async function CreatedAgentsTabs() {
  const published = await getPublished()
  const drafts = await getDrafts()

  return (
    <Tabs defaultValue="published">
      <TabsList>
        <TabsTrigger value="published">Published</TabsTrigger>
        <TabsTrigger value="drafts">Drafts</TabsTrigger>
      </TabsList>
      <TabsContent value="published">
        <DataTable columns={columns} data={published} />
      </TabsContent>
      <TabsContent value="drafts">
        <DataTable columns={columns} data={drafts} />
      </TabsContent>
    </Tabs>
  )
}