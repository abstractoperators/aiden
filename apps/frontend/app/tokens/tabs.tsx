import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns"
// import { getIncubating, getEnlightened } from "@/lib/api/agent";
import { getTokens } from "@/lib/api/token";

export default async function AgentsTabs() {
    const tokens = await getTokens();

    return (
        <Tabs defaultValue="Tokens">
            <TabsList>
                <TabsTrigger value="Tokens">Tokens</TabsTrigger>
            </TabsList>
            <TabsContent value="Tokens">
                <DataTable columns={columns} data={tokens} />
            </TabsContent>
        </Tabs>
    )
}