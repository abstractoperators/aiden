// https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
import { auth } from "@/auth"
import AgentCard from "@/components/agent-card"
import Chat from "@/components/chat"
import { buttonVariants } from "@/components/ui/button"
import { getAgent } from "@/lib/api/agent"
import { getUser } from "@/lib/api/user"
import { cn } from "@/lib/utils"
import { Pencil } from "lucide-react"
import Link from "next/link"

// TODO: start agent button

export default async function AgentHome({
  params,
}: {
  params: Promise<{ id: string }>,
}) {
  const id = (await params).id
  const agent = await getAgent(id)
  if (!agent.runtime) {
    console.log("Agent", agent, "has no runtime! Starting agent")
  }
  const name = agent.characterJson.name || agent.id

  const session = await auth()
  const user = session?.user?.id && await getUser({dynamicId: session.user.id})
  const userOwnsAgent = user && user.id === agent.ownerId

  return (
    <main
      className={cn(
        "flex-1 grid grid-cols-12 gap-8 p-8 sm:m-4 md:m-8 lg:m-16",
        "bg-anakiwa-lightest/50 dark:bg-anakiwa-darkest/50 backdrop-blur",
        "rounded-xl relative",
      )}
    >
      { userOwnsAgent &&
        <Link
          href={`/user/agents/edit/${id}`}
          className={cn(
            buttonVariants({
              variant: "ghost",
              size: "icon",
            }),
            "rounded-xl absolute top-4 right-4",
            "hover:bg-anakiwa-lighter/60 dark:hover:bg-anakiwa-dark/40",
          )}
        >
          <Pencil strokeWidth={3}/>
        </Link>
      }
      <div className="col-span-7 flex flex-col items-center">
        <AgentCard name={name} />
      </div>
      <div className="col-span-5 flex flex-row justify-center">
        <div className="flex-1">
          {
            (agent.runtime && agent.elizaAgentId) ?
            <Chat
              elizaId={agent.elizaAgentId}
              runtimeUrl={agent.runtime.url}
            /> : <p className="text-center">
              This agent has no chat.
            </p>
          }
        </div>
      </div>
    </main>
  )
}