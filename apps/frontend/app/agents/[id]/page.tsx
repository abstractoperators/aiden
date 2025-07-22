// https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
import { auth } from "@/auth"
import BiographyCard from "@/components/agent/bio-card"
import FaceCard from "@/components/agent/face-card"
import TagCard from "@/components/agent/tag-card"
import Chat from "@/components/chat"
// import TokenChart from "@/components/token/chart"
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
        "rounded-xl relative bg-panel border border-border shadow-lg",
      )}
    >
      <h1 className="text-foreground text-2xl font-bold">Unable to retrieve Agent information!</h1>
      <h2 className="text-foreground">{agentResult.message}</h2>
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
        "flex-1 self-stretch m-8 grid grid-cols-12 gap-4 px-6 py-6",
        "rounded-xl relative bg-panel border border-border shadow-lg",
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
            "rounded-xl absolute top-2 right-6 hover:bg-anakiwa hover:text-white transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg",
          )}
        >
          <Pencil strokeWidth={3} />
        </Link>
      }
      <div className="col-span-7 flex flex-col items-stretch gap-4">
        <FaceCard name={name} token={token} />
        <BiographyCard {...character} />
        <div className="grid grid-cols-2 gap-4">
          <TagCard tags={character.topics} title="Topics" />
          <TagCard tags={character.adjectives} title="Adjectives" />
        </div>
        {/* {token && <TokenChart token={token} />} */}
      </div>
      <div className="col-span-5 flex flex-col justify-start items-stretch gap-4">
        {/* {token && <SwapCard token={token}/>} */}
        <Chat init={agent} />
      </div>
    </main>
  )
}