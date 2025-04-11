import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns"
import { getTokens } from "@/lib/api/token";
import { isErrorResult } from "@/lib/api/result";

export default async function AgentsTabs() {
    const tokens = await getTokens();
    if (isErrorResult(tokens)) {
        return (
            <main className="flex-1 self-stretch flex flex-col gap-8 m-8 bg-neutral-600/40 backdrop-blur p-8 rounded-xl">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                    Unable to retrieve Token information!
                </h1>
            </main>
        )
    }

    return (
        <Tabs defaultValue="Tokens">
            <TabsList>
                <TabsTrigger value="Tokens">Tokens</TabsTrigger>
            </TabsList>
            <TabsContent value="Tokens">
                <DataTable columns={columns} data={tokens.data} />
            </TabsContent>
        </Tabs>
    )
}