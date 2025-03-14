import { SidebarProvider } from "@/components/ui/sidebar";
import { UserSidebar } from "@/components/user-sidebar";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { getEnlightened } from "@/lib/api/agent";
import { auth } from "@/auth";
import { getUser } from "@/lib/api/user";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  // TODO consider removing in favor of context/context provider
  const session = await auth()
  if (!session)
    throw new Error(`Session ${JSON.stringify(session)} does not exist!`)

  const apiUser = await getUser({dynamic_id: session.user.id})
  const userAgents = (
    await getEnlightened({user_id: apiUser.id})
  ).sort((a, b) => (a.name < b.name) ? -1 : 1);

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