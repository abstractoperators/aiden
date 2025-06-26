// https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
import { auth } from "@/auth"
import AgentCard from "@/components/agent-card"
import DescriptionCard from "@/components/agent-description-card"
import Chat from "@/components/chat"
import TokenChart from "@/components/token/chart"
// import SwapCard from "@/components/token/swap"
import { buttonVariants } from "@/components/ui/button"
import { getAgent } from "@/lib/api/agent"
import { isErrorResult, isSuccessResult } from "@/lib/api/result"
import { getUser, User } from "@/lib/api/user"
import { cn } from "@/lib/utils"
import { Pencil } from "lucide-react"
import Link from "next/link"

export default async function AgentHome({
  params,
}: {
  params: Promise<{ id: string }>,
}) {
  const { id } = await params
  const agentResult = await getAgent(id)

  if (isErrorResult(agentResult)) { return (
    <main
      className={cn(
        "flex-1 self-stretch m-8 grid grid-cols-12 gap-2 p-12",
        "bg-anakiwa-lightest/50 dark:bg-anakiwa-darkest/50 backdrop-blur",
        "rounded-xl relative",
      )}
    >
      <h1>Unable to retrieve Agent information!</h1>
      <h2>{agentResult.message}</h2>
    </main>
  )}

  const agent = agentResult.data
  const { characterJson: character, ownerId, token } = agent
  const name = character.name || agent.id
  const session = await auth()
  const user = session?.user?.id && await getUser({ dynamicId: session.user.id })
  const userOwnsAgent = true
    && user
    && isSuccessResult<User>(user)
    && user.data.id === ownerId

  return (
    <main
      className={cn(
        "flex-1 self-stretch m-8 grid grid-cols-12 gap-2 px-6 py-6",
        "bg-anakiwa-lightest/50 dark:bg-anakiwa-darkest/50 backdrop-blur",
        "rounded-xl relative",
        userOwnsAgent ? "pt-14": "",
      )}
    >
      {userOwnsAgent &&
        <Link
          href={`/user/agents/edit/${id}`}
          className={cn(
            buttonVariants({
              variant: "ghost",
              size: "icon",
            }),
            "rounded-xl absolute top-2 right-6",
            "hover:bg-anakiwa-lighter/60 dark:hover:bg-anakiwa-dark/40",
          )}
        >
          <Pencil strokeWidth={3} />
        </Link>
      }
      <div className="col-span-7 flex flex-col items-stretch gap-2">
        <AgentCard name={name} token={token} />
        <DescriptionCard {...character} />
        <TokenChart token={token} />
      </div>
      <div className="col-span-5 flex flex-col justify-start items-stretch gap-2">
        {/* <SwapCard token={token}/> */}
        <Chat init={agent} />
      </div>
    </main>
  )
}