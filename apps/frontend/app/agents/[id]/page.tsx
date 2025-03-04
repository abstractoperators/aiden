// https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
import Chat from "@/components/chat"
import { getAgent, getRuntime } from "@/lib/agent"

export default async function AgentHome({
  params,
}: {
  params: Promise<{ id: string }>,
}) {
  const id = (await params).id
  const agent = await getAgent(id)
  if (!agent.runtime)
    console.log(`Agent ${agent.character_json.name} has no runtime!`)

  return (
    <main className="flex-1 flex flex-col w-5/6 justify-start items-center gap-8 m-8 sm:m-4 md:m-8 lg:m-16">
      <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
        {agent.character_json.name}
      </h1>
      {
        agent.runtime ?
        <Chat runtimeUrl={agent.runtime.url} /> :
        <p>This agent has no chat.</p>
      }
    </main>
  )
}