import { auth } from "@/auth";
import AgentForm from "@/components/agent-form";
import { getAgent } from "@/lib/api/agent";
import { getUser } from "@/lib/api/user";

export default async function AgentEdit({
  params,
}: {
  params: Promise<{ id: string }>,
}) {
  const id = (await params).id
  const { characterJson, envFile, ownerId, runtimeId } = await getAgent(id)

  const session = await auth()
  const user = session?.user?.id && await getUser({dynamicId: session.user.id})
  const userOwnsAgent = user && user.id === ownerId

  return (userOwnsAgent ? 
    <div className="my-16 mx-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl my-8">
        Edit Agent {characterJson.name}
      </h1>
      <AgentForm
        defaultValues={{
          env: envFile.map(({ key, value }) => `${key}=${value || ""}`).join("\n"),
          twitter: characterJson.clients.includes("twitter"),
          ...characterJson
        }}
        agentId={id}
        runtimeId={runtimeId || undefined}
      />
    </div> : <div className="my-16 mx-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl my-8">
        You don&#39;t own agent {characterJson.name}!
      </h1>
    </div>
  )
}