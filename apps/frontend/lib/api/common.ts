'use server'

function fromApiEndpoint(url: string): URL {
  return new URL(url, process.env.API_ENDPOINT)
}

async function getResource<ResponseType>(
  baseUrl: URL | string,
  options: {
    resourceId?: string,
    query?: URLSearchParams,
  } = {},
): Promise<ResponseType> {
  try {
    const { resourceId, query } = options
    const resourceUrl = resourceId ? new URL(resourceId, baseUrl) : new URL(baseUrl)
    const url = query ? new URL(`${resourceUrl.href}?${query.toString()}`) : resourceUrl

    const response = await fetch(url);

    if (!response.ok)
      throw new Error(`Failed to GET at ${url} with response ${JSON.stringify(response)}`)

    return response.json()
  } catch (error) {
    console.error(error)
  }
  throw new Error("Logic error, this should never be reached.")
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
        headers: (body) ? {
          'Content-Type': 'application/json',
        } : undefined,
        body: JSON.stringify(body),
      }
    )

    if (!response.ok)
      throw new Error(`Failed to CREATE at ${url} with body ${body} and response ${JSON.stringify(response)}`)

    return response.json()
  } catch (error) {
    console.error(error)
  }
  throw new Error("Logic error, this should never be reached.")
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
        headers: (body) ? {
          'Content-Type': 'application/json',
        } : undefined,
        body: JSON.stringify(body),
      }
    )

    if (!response.ok)
      throw new Error(`Failed to UPDATE at ${url} with body ${body} and response ${JSON.stringify(response)}`)

    return response.json()
  } catch (error) {
    console.error(error)
  }
  throw new Error("Logic error, this should never be reached.")
}

async function deleteResource(
  baseUrl: URL | string,
  resourceId: string,
): Promise<any> {
  try {
    const url = new URL(resourceId, baseUrl)
    const response = await fetch(
      url,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok)
      throw new Error(`Failed to DELETE at ${url} with response ${JSON.stringify(response)}`)

    return response.json()
  } catch (error) {
    console.error(error)
  }
  throw new Error("Logic error, this should never be reached.")
}

export {
  createResource,
  deleteResource,
  fromApiEndpoint,
  getResource,
  updateResource,
}