import ProtectedRoute from "@/components/protected-route";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { UserSidebar } from "@/components/user-sidebar";
import Footer from "@/components/footer";
import Header from "@/components/header";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex flex-col w-full min-h-screen">
          <Header />
          <div className="flex-1 flex">
            <UserSidebar className="top-14" collapsible="none" />
              <main>
                {children}
              </main>
          </div>
          <Footer />
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  )
}