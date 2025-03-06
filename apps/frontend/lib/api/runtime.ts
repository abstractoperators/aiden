import { createResource, fromApiEndpoint, getResource } from "./common"

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
  return await createResource<Runtime>(baseUrl)
}

export {
  createRuntime,
  getRuntime,
}

export type {
  Runtime,
}
