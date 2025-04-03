'use server'

import {
  createResource,
  fromApiEndpoint,
  getResource,
} from "./common"

interface RuntimeBase {
  url: string
  started?: boolean
}

interface Runtime extends RuntimeBase {
  id: string
}

const RUNTIME_PATH = '/runtimes'
const RUNTIME_SEGMENT = '/runtimes/'
const baseUrlSegment = fromApiEndpoint(RUNTIME_SEGMENT)
const baseUrlPath = fromApiEndpoint(RUNTIME_PATH)

async function getRuntimes(unused: boolean = true): Promise<Runtime[]> {
  return getResource<Runtime[]>({
    baseUrl: baseUrlPath,
    query: { unused },
  })
}

async function getRuntime(
  runtimeId?: string,
): Promise<Runtime> {
  if (runtimeId) {
    return getResource<Runtime>({
      baseUrl: baseUrlSegment,
      resourceId: runtimeId,
    })
  } else {
    const unusedRuntimes = await getRuntimes()
    // if no unused runtime, get a random one
    // TODO: delete once getlatestruntime is implemented on API
    const runtime: Runtime = unusedRuntimes.length ?
      unusedRuntimes[0] :
      await (async () => {
        console.log("No unused runtimes to start an agent, getting a random runtime")
        const runtimes: Runtime[] = (
          await getRuntimes(false)
          .then(list => list.length ? list : Promise.all([createRuntime()]))
        )
        return runtimes[Math.floor(Math.random() * runtimes.length)]
      })()
    
    return runtime
  }
}

async function createRuntime(): Promise<Runtime> {
  return createResource<Runtime>(baseUrlPath)
}

export {
  createRuntime,
  getRuntime,
  getRuntimes,
}

export type {
  Runtime,
}
