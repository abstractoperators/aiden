'use server'

import { auth } from "@/auth"
import { snakify } from "@/lib/utils"
import { createResult, isNotFound, Result } from "./result"

async function getHeaders<RequestType>(
  body?: RequestType
): Promise<Headers | undefined> {
  const session = await auth()
  const authToken = session?.user?.token
  if (!authToken && !body)
    return undefined

  return new Headers({
    ...(authToken ? {Authorization: `Bearer ${authToken}`} : {}),
    ...(body ? {'Content-Type': 'application/json'} : {}),
  })
}

function jsonifyBody<RequestType>(body?: RequestType) {
  return body && JSON.stringify(snakify(body))
}

function fromApiEndpoint(url: string): URL {
  return new URL(url, process.env.API_ENDPOINT)
}

async function getResource<T>({
  baseUrl,
  resourceId,
  query,
} : {
  baseUrl: URL | string,
  resourceId?: string,
  query?: Record<string, unknown>,
}): Promise<Result<T>> {
  const resourceUrl = resourceId ? new URL(resourceId, baseUrl) : new URL(baseUrl)
  const snakifiedQuery = query && snakify(query)
  const params = snakifiedQuery && new URLSearchParams(
    ( typeof(snakifiedQuery) === "string" )
    ? snakifiedQuery
    : Object.fromEntries(Object.entries(snakifiedQuery).map(([key, value]) => (
      [key, String(value)]
    )))
  )
  const url = params ? new URL(`${resourceUrl.href}?${params.toString()}`) : resourceUrl

  const response = await fetch(
    url,
    { headers: await getHeaders(), },
  );

  return createResult<T>(
    response,
    `Failed to GET at ${url} with response ${JSON.stringify(response)}`,
  )
}

async function createResource<O, I = undefined>(
  url: URL | string,
  body?: I,
): Promise<Result<O>> {
  const response = await fetch(
    url,
    {
      method: 'POST',
      headers: await getHeaders(body),
      body: jsonifyBody(body),
    }
  )

  return createResult(
    response,
    `Failed to CREATE at ${url} with body ${body} and response ${JSON.stringify(response)}`,
  )
}

async function updateResource<O, I = undefined>({
  baseUrl,
  resourceId,
  body,
} : {
  baseUrl: URL | string,
  resourceId: string,
  body?: I,
}): Promise<Result<O>> {
  const url = new URL(resourceId, baseUrl)
  const response = await fetch(
    url,
    {
      method: 'PATCH',
      headers: await getHeaders(body),
      body: jsonifyBody(body),
    }
  )

  return createResult(
    response,
    `Failed to UPDATE at ${url} with body ${body} and response ${JSON.stringify(response)}`,
  )
}

async function updateOrCreateResource<
  O,
  U = undefined,
  C = undefined,
>({
  baseUpdateUrl,
  resourceId,
  updateBody,
  createUrl,
  createBody,
}: {
  baseUpdateUrl: URL | string,
  resourceId: string,
  updateBody?: U,
  createUrl: URL | string,
  createBody?: C,
}): Promise<Result<O>> {

  return (
    updateResource<O, U>({
      baseUrl: baseUpdateUrl,
      resourceId,
      body: updateBody,
    })
    .then(result => (
      ( isNotFound(result) )
      ? createResource(createUrl, createBody)
      : result
    ))
  )
}

async function deleteResource(
  baseUrl: URL | string,
  resourceId: string,
): Promise<Result<unknown>> {
  const url = new URL(resourceId, baseUrl)
  const response = await fetch(
    url,
    {
      method: 'DELETE',
      headers: await getHeaders(),
    }
  );

  return createResult(
    response,
    `Failed to DELETE at ${url} with response ${JSON.stringify(response)}`,
    false,
  )
}

export {
  createResource,
  deleteResource,
  fromApiEndpoint,
  getResource,
  updateResource,
  updateOrCreateResource,
}