import { getEnlightened } from "@/lib/api/agent";
import FormTabs from "./tabs";
import { auth } from "@/auth";
import { getUser } from "@/lib/api/user";
import { isErrorResult, isSuccessResult } from "@/lib/api/result";

export default async function AgentCreation() {
  // TODO consider removing in favor of context/context provider
  const session = await auth()
  if (!session)
    throw new Error('Session does not exist!')
  if (!session.user)
    throw new Error(`Session ${JSON.stringify(session)} does not have a user!`)
  if (!session.user.id)
    throw new Error(`Session user ${JSON.stringify(session.user)} does not have an ID!`)
  if (!session.user.scopes)
    throw new Error(`Session user ${JSON.stringify(session.user)} does not have scopes!`)

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
    <div className="my-16 mx-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl my-8">
        Create an Agent
      </h1>
      {
        isSuccessResult(userAgents) ?
        (
          userAgents.data.length > 0 && !session.user.scopes.includes('admin') ?
          <h2>You may only have one agent at a time!</h2> :
          <FormTabs />
        ) :
        <h2>Unable to prepare agent creation form!</h2>
      }
    </div>
  )
}