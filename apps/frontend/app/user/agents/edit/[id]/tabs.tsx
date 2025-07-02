import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import JsonAgentBuilder from "../../../../../components/agent/builder/json";
import NativeAgentBuilder from "@/components/agent/builder/native";
import { Agent } from "@/lib/api/agent";

export default function FormTabs({
  id,
  characterJson,
  envFile,
  tokenId,
}: Agent) {
  const commonProps = {
    env: envFile.map(({ key, value }) => ({key, value: value ?? ""})),
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
          defaultValues={{
            twitter: characterJson.clients.includes("twitter"),
            isNewToken: false,
            ...commonProps,
            ...characterJson,
          }}
          agentId={id}
        />
      </TabsContent>
      <TabsContent value="json">
        <JsonAgentBuilder
          defaultValues={{
            character: JSON.stringify(characterJson, null, 4),
            isNewToken: false,
            ...commonProps,
          }}
          agentId={id}
        />
      </TabsContent>
    </Tabs>
  )
}