import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserSidebar } from "@/components/userSidebar";

export default function Profile() {
  return (
    <div className="flex flex-col min-h-screen">
    
        <Header />
        <SidebarProvider>
          <main>
            <UserSidebar />
            <SidebarInset>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                You made it to <SidebarTrigger /> the profile page!
              </h1>
            </SidebarInset>
          </main>
      </SidebarProvider>
        <Footer />
        
    </div>
  )
}