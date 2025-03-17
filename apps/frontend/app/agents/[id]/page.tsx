// https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
import AgentCard from "@/components/agent-card"
import Chat from "@/components/chat"
import { getAgent } from "@/lib/api/agent"

export default async function AgentHome({
  params,
}: {
  params: Promise<{ id: string }>,
}) {
  const id = (await params).id
  const agent = await getAgent(id)
  if (!agent.runtime)
    console.log("Agent", agent, "has no runtime!")
  const name = agent.characterJson.name || "Nameless"

  return (
    <main className="w-full flex-1 grid grid-cols-12 gap-8 p-16 sm:m-4 md:m-8 lg:m-16">
      <div className="col-span-7 flex flex-col items-center my-8">
        <AgentCard name={name} />
        <div></div>
      </div>
      <div className="col-span-5 flex flex-row justify-center my-8">
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