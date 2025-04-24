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
    <Tabs className="bg-anakiwa-lighter/50 dark:bg-anakiwa-darker/50 p-4 rounded-xl" defaultValue="create">
      <TabsList>
        <TabsTrigger value="create">Create</TabsTrigger>
        <TabsTrigger value="upload">Upload</TabsTrigger>
      </TabsList>
      <TabsContent value="create">
        <AgentForm />
      </TabsContent>
      <TabsContent value="upload">
        <UploadForm />
      </TabsContent>
    </Tabs>
  )
}