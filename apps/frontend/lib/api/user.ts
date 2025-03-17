'use server'

import { UserProfile } from "@dynamic-labs/sdk-react-core";
import { createResource, fromApiEndpoint, getResource, updateResource } from "./common";
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

function dynamicToApiUser(
  user: UserProfile,
): UserBase {
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
    { publicKey: string } |
    { dynamicId: string }
  )
): Promise<User> {
  return getResource<User>(
    baseUrlPath,
    { query: query },
  )
}

async function createUser(userPayload: UserBase): Promise<User> {
  return createResource<User, UserBase>(baseUrlPath, userPayload)
}

async function updateUser(userId: string, userUpdate: UserUpdate): Promise<User> {
  return updateResource(
    baseUrlSegment,
    userId,
    userUpdate,
  )
}

export {
  createUser,
  dynamicToApiUser,
  getUser,
  updateUser,
}