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
  runtimeId: string,
): Promise<Runtime> {
  return getResource<Runtime>({
    baseUrl: baseUrlSegment,
    resourceId: runtimeId,
  })
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
