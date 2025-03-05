import { UserProfile } from "@dynamic-labs/sdk-react-core";
import { fromApiEndpoint, getResource } from "./common";

interface UserBase {
  public_key: string
  public_key_sei: string
  email?: string | null
  phone_number?: string | null
  username?: string | null
}

interface User extends UserBase {
  id: string
}

const baseUrl = fromApiEndpoint('users')

async function getUser(publicKey: string): Promise<User> {
  return await getResource<User>(
    baseUrl,
    { query: new URLSearchParams({ public_key: publicKey }) },
  )
}

async function createUser(userPayload: UserBase): Promise<User> {
  try {
    const response = await fetch(
      baseUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userPayload),
      }
    )

    if (!response.ok)
      throw new Error(`Failed to create user: ${JSON.stringify(userPayload)}`)

    return (await response.json()) as User
  } catch (error) {
    console.error(error)
  }
  throw new Error("Logic error, this should never be reached.")
}

async function getOrCreateUser(userPayload: UserBase): Promise<User> {
  try {
    return getUser(userPayload.public_key).catch(() => createUser(userPayload))
  } catch (error) {
    console.error(error)
  }
  throw new Error("Logic error, this should never be reached.")
}

function dynamicToApiUser(
  ethAddress: string,
  seiAddress: string,
  user?: UserProfile,
): UserBase {
  return {
    public_key: ethAddress,
    public_key_sei: seiAddress,
    email: user?.email,
    phone_number: user?.phoneNumber,
    username: user?.username,
  }
}

export {
  createUser,
  dynamicToApiUser,
  getOrCreateUser,
}