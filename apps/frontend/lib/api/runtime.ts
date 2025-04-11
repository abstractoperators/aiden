'use server'

import {
  createResource,
  fromApiEndpoint,
  getResource,
} from "./common"
import { Result, createSuccessResult, isErrorResult } from "./result"

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

async function getRuntimes(unused: boolean = true): Promise<Result<Runtime[]>> {
  return getResource<Runtime[]>({
    baseUrl: baseUrlPath,
    query: { unused },
  })
}

async function getRuntime(
  runtimeId?: string,
): Promise<Result<Runtime>> {
  if (runtimeId) {
    return getResource<Runtime>({
      baseUrl: baseUrlSegment,
      resourceId: runtimeId,
    })
  }

  const unusedRuntimes = await getRuntimes()
  if (isErrorResult(unusedRuntimes)) {
    return unusedRuntimes
  } else if (unusedRuntimes.data.length) {
    return createSuccessResult(unusedRuntimes.data[0])
  }

  // if no unused runtime, get a random one
  // TODO: delete once getlatestruntime is implemented on API
  console.debug("No unused runtimes to start an agent, getting a random runtime")
  const getRandomRuntime = (runtimes: Runtime[]) => (
    runtimes[Math.floor(Math.random() * runtimes.length)]
  )
  const runtimes = await getRuntimes(false)
  if (isErrorResult(runtimes)) {
    return runtimes
  } else if (runtimes.data.length) {
    return createSuccessResult(getRandomRuntime(runtimes.data))
  }

  return createRuntime()
}

async function createRuntime(): Promise<Result<Runtime>> {
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
