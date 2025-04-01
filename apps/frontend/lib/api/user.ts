'use server'

import { UserProfile } from "@dynamic-labs/sdk-react-core";
import {
  createResource,
  fromApiEndpoint,
  getResource,
  updateResource,
  UrlResourceNotFoundError,
} from "./common";
import { WalletBase } from "./wallet";

const USER_PATH = '/users'
const USER_SEGMENT = '/users/'

const baseUrlPath = fromApiEndpoint(USER_PATH)
const baseUrlSegment = fromApiEndpoint(USER_SEGMENT)

interface UserUpdate {
  email?: string | null
  phoneNumber?: string | null
  username?: string | null
}

interface UserBase extends UserUpdate{
  dynamicId: string
}

interface User extends UserBase {
  id: string
  wallets: WalletBase[]
}

// https://react.dev/reference/rsc/use-server#use-server see 'caveats'
async function dynamicToApiUser(
  user: UserProfile,
): Promise<UserBase> {
  if (!user.userId)
    throw new Error(`Dynamic User ${user} has no ID!!!`)
  return {
    dynamicId: user.userId,
    email: user.email,
    phoneNumber: user.phoneNumber,
    username: user.username,
  }
}

async function getUser(
  query: (
    { userId: string } |
    { publicKey: string, chain?: string } |
    { dynamicId: string }
  ),
  headers?: Record<string, string>
): Promise<User> {
  return getResource<User>(
    baseUrlPath,
    { query: query, headers: headers },
  )
}

async function createUser(userPayload: UserBase): Promise<User> {
  return createResource<User, UserBase>(baseUrlPath, userPayload)
}

async function updateUser(userId: string, userUpdate: UserUpdate, headers?: Record<string, string>): Promise<User> {
  return updateResource(
    baseUrlSegment,
    userId,
    userUpdate,
    headers,
  )
}

async function getOrCreateUser(
  userPayload: UserBase,
): Promise<User> {
  const { dynamicId } = userPayload
  return getUser({ dynamicId: dynamicId }).catch(error => {
    if (error instanceof UrlResourceNotFoundError) {
      return createUser(userPayload)
    } else {
      throw error
    }
  })
}

export {
  createUser,
  dynamicToApiUser,
  getUser,
  getOrCreateUser,
  updateUser,
}