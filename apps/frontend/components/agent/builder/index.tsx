import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import JsonAgentBuilder from "@/components/agent/builder/json";
import NativeAgentBuilder from "@/components/agent/builder/native";
import { Agent } from "@/lib/api/agent";
import { Clients } from "@/lib/schemas/character";

export default function AgentBuilder({
  id,
  characterJson,
  envFile,
  tokenId,
}: Partial<Agent>) {
  const agentExists = !!(id && characterJson && envFile)
  const commonProps = {
    env: envFile?.map(({ key, value }) => ({key, value: value ?? ""})) ?? [],
    tokenId: tokenId || "",
  }

  return (
    <Tabs className="bg-anakiwa-lighter/50 dark:bg-anakiwa-darker/50 p-4 rounded-xl" defaultValue="json">
      <TabsList>
        <TabsTrigger value="native">Native</TabsTrigger>
        <TabsTrigger value="json">JSON</TabsTrigger>
      </TabsList>
      <TabsContent value="native">
        <NativeAgentBuilder
          defaultValues={agentExists ? {
            twitter: characterJson.clients.includes(Clients.TWITTER),
            isNewToken: false,
            ...commonProps,
            ...characterJson,
          } : undefined}
          agentId={id}
        />
      </TabsContent>
      <TabsContent value="json">
        <JsonAgentBuilder
          defaultValues={agentExists ? {
            character: JSON.stringify(characterJson, null, 4),
            isNewToken: false,
            ...commonProps,
          } : undefined}
          agentId={id}
        />
      </TabsContent>
    </Tabs>
  )
}