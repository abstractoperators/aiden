import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import JsonAgentBuilder from "../../../../components/agent/builder/json";
import NativeAgentBuilder from "@/components/agent/builder/native";

export default function FormTabs() {
  return (
    <Tabs className="bg-anakiwa-lighter/50 dark:bg-anakiwa-darker/50 p-4 rounded-xl" defaultValue="json">
      <TabsList>
        <TabsTrigger value="native">Native</TabsTrigger>
        <TabsTrigger value="json">JSON</TabsTrigger>
      </TabsList>
      <TabsContent value="native">
        <NativeAgentBuilder />
      </TabsContent>
      <TabsContent value="json">
        <JsonAgentBuilder />
      </TabsContent>
    </Tabs>
  )
}