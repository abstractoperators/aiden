'use server'

import { auth } from "@/auth"
import { camelize, snakify } from "@/lib/utils"

class UrlResourceBadRequestError extends Error {
  constructor(url: string, text: string) {
    super(`Made a bad request to ${url}! Got ${text}`)
    this.name = "UrlResourceBadRequestError"
    // It's recommended to set the prototype explicitly.
    Object.setPrototypeOf(this, UrlResourceBadRequestError.prototype)
  }
}

class UrlResourceUnauthorizedError extends Error {
  constructor(url: string, text: string) {
    super(`Resource at ${url} unauthorized! Got ${text}`)
    this.name = "UrlResourceUnauthorizedError"
    // It's recommended to set the prototype explicitly.
    Object.setPrototypeOf(this, UrlResourceUnauthorizedError.prototype)
  }
}

class UrlResourceForbiddenError extends Error {
  constructor(url: string, text: string) {
    super(`Resource at ${url} forbidden! Got ${text}`)
    this.name = "UrlResourceForbiddenError"
    // It's recommended to set the prototype explicitly.
    Object.setPrototypeOf(this, UrlResourceForbiddenError.prototype)
  }
}

class UrlResourceNotFoundError extends Error {
  constructor(url: string, text: string) {
    super(`Resource at ${url} not found! Got ${text}`)
    this.name = "UrlResourceNotFoundError"
    // It's recommended to set the prototype explicitly.
    Object.setPrototypeOf(this, UrlResourceNotFoundError.prototype)
  }
}

async function checkResponseStatus(response: Response): Promise<void> {
  const { status, url } = response
  const text = await response.text()

  switch (status) {
    case 400:
      throw new UrlResourceBadRequestError(url, text)
    case 401:
      throw new UrlResourceUnauthorizedError(url, text)
    case 403:
      throw new UrlResourceForbiddenError(url, text)
    case 404:
      throw new UrlResourceNotFoundError(url, text)
  }
}

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

async function getResource<ResponseType>({
  baseUrl,
  resourceId,
  query,
} : {
  baseUrl: URL | string,
  resourceId?: string,
  query?: Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
}): Promise<ResponseType> {
  try {
    const resourceUrl = resourceId ? new URL(resourceId, baseUrl) : new URL(baseUrl)
    const params = query && new URLSearchParams(snakify(query))
    const url = params ? new URL(`${resourceUrl.href}?${params.toString()}`) : resourceUrl

    const response = await fetch(
      url,
      { headers: await getHeaders(), },
    );

    await checkResponseStatus(response)
    if (!response.ok)
      throw new Error(`Failed to GET at ${url} with response ${JSON.stringify(response)}`)

    return camelize(await response.json() as Record<string, any>) // eslint-disable-line @typescript-eslint/no-explicit-any
  } catch (error) {
    throw error
  }
}

async function createResource<ResponseType, RequestType = undefined>(
  url: URL | string,
  body?: RequestType,
): Promise<ResponseType> {
  try {
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: await getHeaders(body),
        body: jsonifyBody(body),
      }
    )

    await checkResponseStatus(response)
    if (!response.ok)
      throw new Error(`Failed to CREATE at ${url} with body ${body} and response ${JSON.stringify(response)}`)

    return camelize(await response.json() as Record<string, any>) // eslint-disable-line @typescript-eslint/no-explicit-any
  } catch (error) {
    throw error
  }
}

async function updateResource<ResponseType, RequestType = undefined>({
  baseUrl,
  resourceId,
  body,
} : {
  baseUrl: URL | string,
  resourceId: string,
  body?: RequestType,
}): Promise<ResponseType> {
  try {
    const url = new URL(resourceId, baseUrl)
    const response = await fetch(
      url,
      {
        method: 'PATCH',
        headers: await getHeaders(body),
        body: jsonifyBody(body),
      }
    )

    await checkResponseStatus(response)
    if (!response.ok)
      throw new Error(`Failed to UPDATE at ${url} with body ${body} and response ${JSON.stringify(response)}`)

    return camelize(await response.json() as Record<string, any>) // eslint-disable-line @typescript-eslint/no-explicit-any
  } catch (error) {
    throw error
  }
}

async function updateOrCreateResource<
  ResponseType,
  UpdateRequestType = undefined,
  CreateRequestType = undefined,
>({
  baseUpdateUrl,
  resourceId,
  updateBody,
  createUrl,
  createBody,
}: {
  baseUpdateUrl: URL | string,
  resourceId: string,
  updateBody?: UpdateRequestType,
  createUrl: URL | string,
  createBody?: CreateRequestType,
}): Promise<ResponseType> {

  return (
    updateResource<ResponseType, UpdateRequestType>({
      baseUrl: baseUpdateUrl,
      resourceId,
      body: updateBody,
    })
    .catch((error) => {
      if (error instanceof UrlResourceNotFoundError) {
        return createResource(createUrl, createBody)
      } else {
        throw error
      }
    })
  )
}

async function deleteResource(
  baseUrl: URL | string,
  resourceId: string,
): Promise<any> { // eslint-disable-line  @typescript-eslint/no-explicit-any

  try {
    const url = new URL(resourceId, baseUrl)
    const response = await fetch(
      url,
      {
        method: 'DELETE',
        headers: await getHeaders(),
      }
    );

    await checkResponseStatus(response)
    if (!response.ok)
      throw new Error(`Failed to DELETE at ${url} with response ${JSON.stringify(response)}`)

    return response.json()
  } catch (error) {
    throw error
  }
}

export {
  createResource,
  deleteResource,
  fromApiEndpoint,
  getResource,
  updateResource,
  updateOrCreateResource,
  UrlResourceNotFoundError,
  UrlResourceUnauthorizedError,
  UrlResourceForbiddenError,
}