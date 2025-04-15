import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns"
import { getIncubating, getEnlightened } from "@/lib/api/agent";
import { isSuccessResult } from "@/lib/api/result";

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
      {
        ( isSuccessResult(enlightened) )
        ? <DataTable columns={columns} data={enlightened.data} />
        : <div>
            <h2>Unable to retrieve enlightened agents!</h2>
            <h3>{enlightened.message}</h3>
          </div>
      }
      </TabsContent>
      <TabsContent value="incubating">
      {
        ( isSuccessResult(incubating) )
        ? <DataTable columns={columns} data={incubating.data} />
        : <div>
            <h2>Unable to retrieve enlightened agents!</h2>
            <h3>{incubating.message}</h3>
          </div>
      }
      </TabsContent>
    </Tabs>
  )
}