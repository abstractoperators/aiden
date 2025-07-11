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
    <div className="min-h-screen bg-background flex flex-col items-center pt-8">
      <div className="w-full max-w-5xl flex flex-col gap-6 items-center">
        <div className="text-foreground">
          <h1>Unable to retrieve AIDN user!</h1>
          <h2>{userResult.message}</h2>
        </div>
      </div>
    </div>
  )}

  const user = userResult.data
  const userAgents = await getEnlightened({userId: user.id})

  return (
    <div className="flex flex-col items-center m-16">
      <div className="w-full max-w-5xl flex flex-col gap-6 items-center">
        <h1 className="text-2xl text-foreground font-sans sm:text-xl md:text-2xl lg:text-3xl mb-8">
          Create an Agent
        </h1>
        {
          isSuccessResult(userAgents) ?
          (
            userAgents.data.length > 0 && !session.user.scopes.includes('admin') ?
            <h2 className="text-foreground font-sans">You may only have one agent at a time!</h2> :
            <FormTabs />
          ) :
          <h2 className="text-foreground font-sans">Unable to prepare agent creation form!</h2>
        }
      </div>
    </div>
  )
}