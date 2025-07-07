import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import UploadForm from "./upload-form";
import AgentForm from "@/components/agent-form";

export default function FormTabs() {
  return (
    <Tabs className="bg-anakiwa-lighter/50 dark:bg-anakiwa-darker/50 p-4 rounded-xl" defaultValue="json">
      <TabsList>
        <TabsTrigger value="native">Native</TabsTrigger>
        <TabsTrigger value="json">JSON</TabsTrigger>
      </TabsList>
      <TabsContent value="native">
        <AgentForm />
      </TabsContent>
      <TabsContent value="json">
        <UploadForm />
      </TabsContent>
    </Tabs>
  )
}