'use server'

import { camelize, snakify } from "@/lib/utils"

class UrlResourceNotFoundError extends Error {
  constructor(url: URL) {
    super(`Resource at ${url} not found!`)
    this.name = "UrlResourceNotFoundError"
    // It's recommended to set the prototype explicitly.
    Object.setPrototypeOf(this, UrlResourceNotFoundError.prototype)
  }
}

function fromApiEndpoint(url: string): URL {
  return new URL(url, process.env.API_ENDPOINT)
}

async function getResource<ResponseType>(
  baseUrl: URL | string,
  {
    resourceId,
    query,
  } :
  {
    resourceId?: string,
    query?: Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  } = {},
): Promise<ResponseType> {
  try {
    const resourceUrl = resourceId ? new URL(resourceId, baseUrl) : new URL(baseUrl)
    const params = query ? new URLSearchParams(snakify(query)) : undefined
    const url = params ? new URL(`${resourceUrl.href}?${params.toString()}`) : resourceUrl

    const response = await fetch(url);

    if (response.status === 404)
      throw new UrlResourceNotFoundError(url)
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
        headers: body ? {
          'Content-Type': 'application/json',
        } : undefined,
        body: body ? JSON.stringify(snakify(body)) : undefined,
      }
    )

    if (!response.ok)
      throw new Error(`Failed to CREATE at ${url} with body ${body} and response ${JSON.stringify(response)}`)

    return camelize(await response.json() as Record<string, any>) // eslint-disable-line @typescript-eslint/no-explicit-any
  } catch (error) {
    throw error
  }
}

async function updateResource<ResponseType, RequestType = undefined>(
  baseUrl: URL | string,
  resourceId: string,
  body?: RequestType,
): Promise<ResponseType> {
  try {
    const url = new URL(resourceId, baseUrl)
    const response = await fetch(
      url,
      {
        method: 'PATCH',
        headers: body ? {
          'Content-Type': 'application/json',
        } : undefined,
        body: body ? JSON.stringify(snakify(body)) : undefined,
      }
    )

    if (response.status === 404)
      throw new UrlResourceNotFoundError(url)
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
    updateResource<ResponseType, UpdateRequestType>(
      baseUpdateUrl,
      resourceId,
      updateBody,
    )
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
      }
    );

    if (response.status === 404)
      throw new UrlResourceNotFoundError(url)
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
}