import ProtectedRoute from "@/components/ProtectedRoute";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { UserSidebar } from "@/components/userSidebar";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex item-center justify-center flex-col min-h-screen">
          <Header />
          <main>
            <UserSidebar />
            <SidebarInset>
              {children}
            </SidebarInset>
          </main>
          <Footer />
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  )
}