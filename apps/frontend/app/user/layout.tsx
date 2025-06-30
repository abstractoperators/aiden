import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { UserSidebar } from "@/components/user-sidebar";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { getEnlightened } from "@/lib/api/agent";
import { auth } from "@/auth";
import { getUser } from "@/lib/api/user";
import { isErrorResult } from "@/lib/api/result";

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

  const userResult = await getUser({dynamicId: session.user.id})

  if (isErrorResult(userResult)) { return (
    <div>
      <h1>Unable to retrieve AIDN user!</h1>
      <h2>{userResult.message}</h2>
    </div>
  )}

  const user = userResult.data
  const userAgents = await getEnlightened({userId: user.id})

  return (
    // TODO: figure out sidebar options
    <SidebarProvider>
      <div className="flex flex-col w-full min-h-screen">
        <Header />
        <div className="flex-1 flex">
          <UserSidebar
            className="top-16 max-h-full"
            collapsible="none"
            variant="floating"
            userAgents={userAgents}
          />
          <SidebarInset >
            <main>
              {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}