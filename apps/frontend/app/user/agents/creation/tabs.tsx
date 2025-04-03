
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateForm, UploadForm } from "./form";

export default function FormTabs() {
  return (
    <Tabs className="bg-anakiwa-lighter/50 p-4 rounded-xl" defaultValue="create">
      <TabsList>
        <TabsTrigger value="create">Create</TabsTrigger>
        <TabsTrigger value="upload">Upload</TabsTrigger>
      </TabsList>
      <TabsContent value="create">
        <CreateForm />
      </TabsContent>
      <TabsContent value="upload">
        <UploadForm />
      </TabsContent>
    </Tabs>
  )
}