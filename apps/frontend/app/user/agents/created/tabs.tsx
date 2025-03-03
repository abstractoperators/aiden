import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Agent, columns } from "./columns"

async function getPublished(): Promise<Agent[]> {
  // TODO: replace with API call
  return []
}

async function getDrafts(): Promise<Agent[]> {
  // TODO: replace with API call
  return []
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