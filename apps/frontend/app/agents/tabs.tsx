import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { getIncubating, getEnlightened } from "@/lib/api/agent";

type AgentsTabsProps = {
  auth_token: string;
};
export default async function AgentsTabs({ auth_token }: AgentsTabsProps) {
  const enlightened = await getEnlightened(auth_token);
  const incubating = await getIncubating(auth_token);

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
  );
}
