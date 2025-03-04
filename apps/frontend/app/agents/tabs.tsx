import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns"
import { getIncubating, getEnlightened } from "@/lib/agent";

export default async function AgentsTabs() {
  const enlightened = await getEnlightened();
  const incubating = await getIncubating();

  return (
    <Tabs defaultValue="enlightened">
      <TabsList>
        <TabsTrigger value="enlightened">Enlightened</TabsTrigger>
        <TabsTrigger value="incubating">Incubating</TabsTrigger>
      </TabsList>
      <TabsContent value="enlightened">
        <DataTable columns={columns} data={enlightened} />
      </TabsContent>
      <TabsContent value="incubating">
        <DataTable columns={columns} data={incubating} />
      </TabsContent>
    </Tabs>
  )
}