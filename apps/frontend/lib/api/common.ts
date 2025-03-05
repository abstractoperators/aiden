function fromApiEndpoint(url: string): URL {
  return new URL(url, process.env.NEXT_PUBLIC_API_ENDPOINT)
}

async function getResource<T>(
  baseUrl: URL,
  options: {
    resourceId?: string,
    query?: URLSearchParams,
  } = {},
): Promise<T> {
  try {
    const { resourceId, query } = options
    const resourceUrl = resourceId ? new URL(resourceId, baseUrl) : baseUrl
    const url = query ? new URL(`${resourceUrl.href}?${query.toString()}`) : resourceUrl

    const response = await fetch(url);

    console.log("url:", url)
    console.log(response)

    if (!response.ok)
      throw new Error(`Failed to retrieve ${url}`)

    return await response.json()
  } catch (error) {
    console.error(error)
  }
  throw new Error("Logic error, this should never be reached.")
}

export {
  fromApiEndpoint,
  getResource,
}