'use server'

import { UserProfile } from "@dynamic-labs/sdk-react-core";
import {
  createResource,
  fromApiEndpoint,
  getResource,
  updateResource,
} from "./common";
import { WalletBase } from "./wallet";
import { Result, isNotFound } from "./result";

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
  )
): Promise<Result<User>> {
  return getResource<User>({
    baseUrl: baseUrlPath,
    query,
  })
}

async function createUser(userPayload: UserBase): Promise<Result<User>> {
  return createResource<User, UserBase>(baseUrlPath, userPayload)
}

async function updateUser(userId: string, userUpdate: UserUpdate): Promise<Result<User>> {
  return updateResource({
    baseUrl: baseUrlSegment,
    resourceId: userId,
    body: userUpdate,
  })
}

async function getOrCreateUser(
  userPayload: UserBase,
): Promise<Result<User>> {
  const { dynamicId } = userPayload
  return getUser({
    dynamicId
  }).then(result => (
    ( isNotFound(result) )
    ? createUser(userPayload)
    : result
  ))
}

export {
  createUser,
  dynamicToApiUser,
  getUser,
  getOrCreateUser,
  updateUser,
}

export type {
  User,
}