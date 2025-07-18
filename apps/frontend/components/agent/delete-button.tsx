"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Agent, deleteAgent, stopAgent } from "@/lib/api/agent";
import { isErrorResult, isNotFound } from "@/lib/api/result";
import { useRouter } from "next/navigation";

export default function DeleteAgentButton({
  characterJson: { name },
  id,
}: Agent) {
  const { toast } = useToast()
  const { push } = useRouter()

  async function stopAndDeleteAgent() {
    // TODO: test deletion
    // TODO: pending state during deletion
    const stopResult = await stopAgent(id)
    if (isErrorResult(stopResult) && !isNotFound(stopResult)) {
      console.error(`Failed to stop Agent ${id} status code ${stopResult.code}, ${stopResult.message}`)
      toast({
        title: `Unable to stop Agent ${name}`,
        description: stopResult.message,
      })
      return
    }
    const deleteResult = await deleteAgent(id)
    if (isErrorResult(deleteResult)) {
      console.error(`Failed to delete Agent ${id} status code ${deleteResult.code}, ${deleteResult.message}`)
      toast({
        title: `Unable to stop Agent ${name}`,
        description: deleteResult.message,
      })
      return
    }

    toast({
      title: `Deleted Agent ${name}!`,
      description: `Agent ${name} no longer exists nor is accessible.`
    })
    push('/agents')
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="lg">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action CANNOT be undone! This will permanently delete Agent {name} and remove its
            data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={stopAndDeleteAgent}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}