import { UserProfile } from "@dynamic-labs/sdk-react-core";
import { createResource, fromApiEndpoint, getResource } from "./common";

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
  return await createResource<User, UserBase>(baseUrl, userPayload)
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