'use server'

import { createResource, fromApiEndpoint, getResource } from "./common"
// TODO: remove when we have a better setup to start agents on runtimes, e.g. background process on client or queuing on API
import { setTimeout } from "node:timers/promises"

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

async function getRuntime(runtimeId: string, delay?: number): Promise<Runtime> {
  await setTimeout(delay)
  return getResource<Runtime>(
    baseUrlSegment,
    { resourceId: runtimeId },
  )
}

async function createRuntime(): Promise<Runtime> {
  return createResource<Runtime>(baseUrlPath)
}

export {
  createRuntime,
  getRuntime,
}

export type {
  Runtime,
}
