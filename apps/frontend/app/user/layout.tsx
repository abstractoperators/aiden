import { SidebarProvider } from "@/components/ui/sidebar";
import { UserSidebar } from "@/components/user-sidebar";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { getEnlightened } from "@/lib/api/agent";
import { auth, SessionUser } from "@/auth";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  const session = await auth()
  const userId = (session?.user as SessionUser).apiId
  const userAgents = (await getEnlightened(userId)).sort((a, b) => (a.name < b.name) ? -1 : 1);

  return (
    <SidebarProvider>
      <div className="flex flex-col w-full min-h-screen">
        <Header />
        <div className="flex-1 flex">
          <UserSidebar className="top-14" collapsible="none" userAgents={userAgents}/>
            <main>
              {children}
            </main>
        </div>
        <Footer />
      </div>
    </SidebarProvider>
  )
}