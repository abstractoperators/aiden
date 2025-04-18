import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns"
import { getTokens } from "@/lib/api/token";
import { isErrorResult } from "@/lib/api/result";

export default async function TokenTabs() {
  const tokens = await getTokens();
  if (isErrorResult(tokens)) {
    return (
      <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">
        Unable to retrieve Token information!
      </h2>
    )
  }

  return (
    <Tabs defaultValue="Pre-bonded">
      <TabsList>
        <TabsTrigger value="Pre-bonded">Pre-bonded</TabsTrigger>
      </TabsList>
      <TabsContent value="Pre-bonded">
        <DataTable columns={columns} data={tokens.data} />
      </TabsContent>
    </Tabs>
  )
}