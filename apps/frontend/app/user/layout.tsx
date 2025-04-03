import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
  if (!session.user)
    throw new Error(`Session ${JSON.stringify(session)} does not have a user!`)
  if (!session.user.id)
    throw new Error(`Session user ${JSON.stringify(session.user)} does not have an ID!`)

  const apiUser = await getUser({dynamicId: session.user.id})
  const userAgents = (
    await getEnlightened({userId: apiUser.id})
  ).sort((a, b) => (a.name < b.name) ? -1 : 1);

  return (
    // TODO: figure out sidebar options
    <SidebarProvider>
      <div className="flex flex-col w-full min-h-screen">
        <Header />
        <div className="flex-1 flex">
          <UserSidebar
            className="top-16 bg-anakiwa-light/30 dark:bg-anakiwa-darker/60 max-h-full"
            collapsible="none"
            variant="floating"
            userAgents={userAgents}
          />
          <SidebarInset className="bg-anakiwa-lightest/50 dark:bg-anakiwa-darkest/50 backdrop-blur">
            <main>
              {children}
            </main>
          </SidebarInset>
        </div>
        <Footer />
      </div>
    </SidebarProvider>
  )
}