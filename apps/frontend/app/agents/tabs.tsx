import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns"
import { getIncubating, getEnlightened } from "@/lib/api/agent";
import { isSuccessResult } from "@/lib/api/result";

export default async function AgentsTabs() {
  const enlightened = await getEnlightened();
  const incubating = await getIncubating();

  return (
    <>
      <div className="rounded-2xl border-2 border-[#1e90ff] bg-[#181C23] p-6 w-full">
        <div className="font-pixelcraft text-white text-2xl mb-4">AGENTS</div>
        <Tabs defaultValue="enlightened">
          <TabsList className="mb-6">
            <TabsTrigger value="enlightened">Enlightened</TabsTrigger>
            <TabsTrigger value="incubating">Incubating</TabsTrigger>
          </TabsList>
          <TabsContent value="enlightened">
            {
              ( isSuccessResult(enlightened) )
              ? <DataTable columns={columns} data={enlightened.data} paginationClassName="mt-8 flex justify-end" />
              : <div>
                  <h2>Unable to retrieve enlightened agents!</h2>
                  <h3>{enlightened.message}</h3>
                </div>
            }
          </TabsContent>
          <TabsContent value="incubating">
            {
              ( isSuccessResult(incubating) )
              ? <DataTable columns={columns} data={incubating.data} paginationClassName="mt-8 flex justify-end" />
              : <div>
                  <h2>Unable to retrieve enlightened agents!</h2>
                  <h3>{incubating.message}</h3>
                </div>
            }
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}