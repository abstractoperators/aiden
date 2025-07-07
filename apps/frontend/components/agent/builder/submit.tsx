import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { createAgent, updateAgent, stopAgent } from "@/lib/api/agent"
import { isErrorResult, isNotFound } from "@/lib/api/result"
import { getUser } from "@/lib/api/user"
import { Character } from "@/lib/schemas/character"
import { LaunchTokenSchema } from "@/lib/schemas/token"
import { cn } from "@/lib/utils"
import { Wallet } from "@dynamic-labs/sdk-react-core"

function AgentBuilderSubmit() {
  return (
    <Button
      className={cn(
        "bg-gradient-to-br from-anakiwa dark:from-anakiwa-dark from-20% to-carnation dark:to-carnation-dark to-80%",
        "font-semibold text-black dark:text-white text-d5",
        "transition duration-300 hover:hue-rotate-60",
        "px-12 py-8 rounded-xl",
      )}
      type="submit"
    >
      Submit
    </Button>
  )
}

interface AgentBuilderOnSubmitProps {
  dynamicId: string
  character: Character
  envFile: string
  token: string | LaunchTokenSchema
  push: (href: string, options?: { scroll: boolean }) => void
  wallet: Wallet | null
}

async function onCreate({
  dynamicId,
  character,
  envFile,
  // token,
  push,
  // wallet,
}: AgentBuilderOnSubmitProps) {
  console.debug("Character", character)
  const userResult = await getUser({ dynamicId })
  console.debug(dynamicId, userResult)

  if (isErrorResult(userResult)) {
    toast({
      title: "Unable to retrieve AIDN user!",
      description: userResult.message,
    })
    return
  }

  // const tokenId = (
  //   (typeof token === "string") ?
  //   token :
  //   await (async () => {
  //     const tokenResult = await launchTokenFactory(wallet)(token)
  //     if (isErrorResult(tokenResult)) {
  //       toast({
  //         title: `Unable to save token ${token.tokenName} ($${token.ticker})`,
  //         description: tokenResult.message,
  //       })
  //     } else {
  //       toast({
  //         title: `Token ${token.tokenName} ($${token.ticker}) created!`,
  //       })
  //       return tokenResult.data.id
  //     }
  //   })()
  // )

  const agentPayload = {
    ownerId: userResult.data.id,
    characterJson: character,
    envFile,
    // tokenId,
  }
  const agentResult = await createAgent(agentPayload)
  if (isErrorResult(agentResult)) {
    toast({
      title: `Unable to create Agent ${character.name}!`,
      description: agentResult.message,
    })
    return
  }

  toast({
    title: `Agent ${character.name} Created!`,
  })
  const { id } = agentResult.data
  push(`/agents/${id}`)
}

function onEditFactory(agentId: string) {
  async function onEdit({
    dynamicId,
    character,
    envFile,
    push,
  }: AgentBuilderOnSubmitProps) {
    console.debug("Character", character)
    const userResult = await getUser({ dynamicId })
    console.debug(dynamicId, userResult)

    if (isErrorResult(userResult)) {
      toast({
        title: "Unable to retrieve AIDN user!",
        description: userResult.message,
      })
      return
    }

    const agentPayload = {
      ownerId: userResult.data.id,
      characterJson: character,
      envFile,
    }

    // update and stop agent
    const updateResult = await updateAgent(agentId, agentPayload)
    if (isErrorResult(updateResult)) {
      toast({
        title: `Unable to update Agent ${character.name}`,
        description: updateResult.message,
      })
      return
    }

    const stopResult = await stopAgent(agentId)
    if (isErrorResult(stopResult) && !isNotFound(stopResult)) {
      console.error(`Failed to stop Agent ${agentId} status code ${stopResult.code}, ${stopResult.message}`)
      toast({
        title: `Unable to stop Agent ${character.name}`,
        description: stopResult.message,
      })
      return
    }
    toast({
      title: `Agent ${character.name} Updated!`,
      description: "Agent has been updated and stopped.",
    })

    push(`/agents/${agentId}`)
  }

  return onEdit
}

function agentBuilderOnSubmit(agentId?: string) {
  return agentId ? onEditFactory(agentId) : onCreate
}

export {
  agentBuilderOnSubmit,
}

export default AgentBuilderSubmit