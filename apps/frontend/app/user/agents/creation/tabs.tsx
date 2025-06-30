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
    <div className="rounded-2xl border-2 bg-[#181C23] p-6 w-full">
      <Tabs defaultValue="json">
        <TabsList className="mb-6">
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
    </div>
  )
}