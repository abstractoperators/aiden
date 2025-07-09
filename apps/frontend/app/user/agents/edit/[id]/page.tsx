import { auth } from "@/auth";
import DeleteAgentButton from "@/components/delete-agent-button";
import { Button } from "@/components/ui/button";
import { getAgent } from "@/lib/api/agent";
import { isErrorResult, isSuccessResult } from "@/lib/api/result";
import { getUser, User } from "@/lib/api/user";
import Link from "next/link";
import FormTabs from "./tabs";

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

  const agent = agentResult.data
  const { characterJson: {name}, ownerId } = agent

  const session = await auth()
  const user = session?.user?.id && await getUser({dynamicId: session.user.id})
  const userOwnsAgent = user && isSuccessResult<User>(user) && user.data.id === ownerId

  return (userOwnsAgent ? 
    <div className="my-16 mx-16 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
        Edit Agent {name}
      </h1>
      <FormTabs
        {...agentResult.data}
      />
      <Button
        variant="destructive"
        size="lg"
        className="transition duration-300 hover:hue-rotate-60"
        asChild
      >
        <Link
          href={`/agents/${id}`}
        >
          Abort
        </Link>
      </Button>
      <div className="pt-32 flex flex-col space-y-2 items-start">
        <h2 className="text-d4">Delete Agent {name} </h2>
        <DeleteAgentButton {...agent} />
      </div>
    </div> : <div className="my-16 mx-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl my-8">
        You don&#39;t own agent {name}!
      </h1>
    </div>
  )
}