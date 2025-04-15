import { auth } from "@/auth";
import AgentForm from "@/components/agent-form";
import DeleteAgentButton from "@/components/delete-agent-button";
import { getAgent } from "@/lib/api/agent";
import { isErrorResult, isSuccessResult } from "@/lib/api/result";
import { getUser, User } from "@/lib/api/user";

export default async function AgentEdit({
  params,
}: {
  params: Promise<{ id: string }>,
}) {
  const id = (await params).id
  const agentResult = await getAgent(id)
  if (isErrorResult(agentResult)) { return (
    <div className="my-16 mx-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl my-8">
        Unable to retrieve Agent Information!
      </h1>
      <h2>{agentResult.message}</h2>
    </div>
  )}

  const { characterJson: character, envFile, ownerId } = agentResult.data
  const { name } = character

  const session = await auth()
  const user = session?.user?.id && await getUser({dynamicId: session.user.id})
  const userOwnsAgent = user && isSuccessResult<User>(user) && user.data.id === ownerId

  return (userOwnsAgent ? 
    <div className="flex flex-col justify-start items-stretch my-16 mx-16 space-y-4">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
        Edit Agent {name}
      </h1>
      <AgentForm
        defaultValues={{
          env: envFile.map(({ key, value }) => `${key}=${value || ""}`).join("\n"),
          twitter: character.clients.includes("twitter"),
          ...character
        }}
        agentId={id}
      />
      <div className="pt-32 flex flex-col space-y-2 items-start">
        <h2 className="text-d4">Delete Agent {name} </h2>
        <DeleteAgentButton name={name} />
      </div>
    </div> : <div className="my-16 mx-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl my-8">
        You don&#39;t own agent {name}!
      </h1>
    </div>
  )
}