'use server'

function fromApiEndpoint(url: string): URL {
  return new URL(url, process.env.API_ENDPOINT)
}

async function getResource<ResponseType>(
  baseUrl: URL,
  options: {
    resourceId?: string,
    query?: URLSearchParams,
  } = {},
): Promise<ResponseType> {
  try {
    const { resourceId, query } = options
    const resourceUrl = resourceId ? new URL(resourceId, baseUrl) : baseUrl
    const url = query ? new URL(`${resourceUrl.href}?${query.toString()}`) : resourceUrl

    const response = await fetch(url);

    if (!response.ok)
      throw new Error(`Failed to retrieve ${url} with response ${JSON.stringify(response)}`)

    return response.json()
  } catch (error) {
    console.error(error)
  }
  throw new Error("Logic error, this should never be reached.")
}

async function createResource<ResponseType, RequestType = undefined>(
  baseUrl: URL,
  body?: RequestType,
): Promise<ResponseType> {
  try {
    const response = await fetch(
      baseUrl,
      {
        method: 'POST',
        headers: (body) ? {
          'Content-Type': 'application/json',
        } : undefined,
        body: JSON.stringify(body),
      }
    )

    if (!response.ok)
      throw new Error(`Failed to create at ${baseUrl} with body ${body}`)

    return response.json() as ResponseType
  } catch (error) {
    console.error(error)
  }
  throw new Error("Logic error, this should never be reached.")
}

export {
  createResource,
  fromApiEndpoint,
  getResource,
}