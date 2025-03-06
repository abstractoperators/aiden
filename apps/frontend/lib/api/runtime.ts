import { fromApiEndpoint, getResource } from "./common"

interface RuntimeBase {
  url: string
  started?: boolean
}

interface Runtime extends RuntimeBase {
  id: string
}

const baseUrl = fromApiEndpoint('runtimes/')

async function getRuntime(runtimeId: string): Promise<Runtime> {
  return await getResource<Runtime>(
    baseUrl,
    { resourceId: runtimeId },
  )
}

async function createRuntime(): Promise<Runtime> {
  try {
    const response = await fetch(
      baseUrl,
      { method: 'POST', },
    )

    if (!response.ok)
      throw new Error("Failed to create runtime")

    return await response.json()
  } catch (error) {
    console.error(error)
  }
  throw new Error("Logic error, this should never be reached.")
}

export {
  createRuntime,
  getRuntime,
}

export type {
  Runtime,
}
