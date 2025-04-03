// https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
import { auth } from "@/auth"
import AgentCard from "@/components/agent-card"
import Chat from "@/components/chat"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAgent } from "@/lib/api/agent"
import { getUser } from "@/lib/api/user"
import { cn } from "@/lib/utils"
import { Pencil, Coins } from "lucide-react"
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
  const tokenId = agent.tokenId
  console.log("Agent has tokenId", tokenId)

  const session = await auth()
  const user = session?.user?.id && await getUser({ dynamicId: session.user.id })
  const userOwnsAgent = user && user.id === agent.ownerId

  return (
    <main
      className={cn(
        "flex-1 self-stretch m-8 grid grid-cols-12 gap-2 p-12",
        "bg-anakiwa-lightest/50 dark:bg-anakiwa-darkest/50 backdrop-blur",
        "rounded-xl relative",
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
            "rounded-xl absolute top-2 right-2",
            "hover:bg-anakiwa-lighter/60 dark:hover:bg-anakiwa-dark/40",
          )}
        >
          <Pencil strokeWidth={3} />
        </Link>
      }
      <div className="col-span-7 flex flex-col items-stretch gap-2">
        {tokenId && (
          <Link
            href={`/tokens/${tokenId}`}
            className={cn(
              buttonVariants({
                variant: "ghost",
                size: "icon",
              }),
              "rounded-xl",
              "hover:bg-anakiwa-lighter/60 dark:hover:bg-anakiwa-dark/40",
            )}
          >
            <Coins strokeWidth={3} />
          </Link>
        )}
        <AgentCard name={name} />
        <Card className="bg-anakiwa-darker/30 dark:bg-anakiwa/30 rounded-xl border-none">
          <CardHeader>
            <CardTitle className="text-d5">Basics</CardTitle>
          </CardHeader>
          <CardContent>
            {agent.characterJson.bio.length ? (
              <div>
                <h2 className="font-sans text-d6">Bio</h2>
                {agent.characterJson.bio.map(str => (
                  <p key={str}>{str}</p>
                ))}
              </div>
            ) : <></>}
            {agent.characterJson.lore.length ? (
              <div>
                <h2 className="font-sans text-d6">Lore</h2>
                {agent.characterJson.lore.map(str => (
                  <p key={str}>{str}</p>
                ))}
              </div>
            ) : <></>}
            {agent.characterJson.topics.length ? (
              <div>
                <h2 className="font-sans text-d6">Topics</h2>
                {agent.characterJson.topics.map(str => (
                  <p key={str}>{str}</p>
                ))}
              </div>
            ) : <></>}
            {agent.characterJson.adjectives.length ? (
              <div>
                <h2 className="font-sans text-d6">Adjectives</h2>
                {agent.characterJson.adjectives.map(str => (
                  <p key={str}>{str}</p>
                ))}
              </div>
            ) : <></>}
          </CardContent>
        </Card>
      </div>
      <div className="col-span-5 flex flex-col justify-start items-stretch">
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
    </main>
  )
}