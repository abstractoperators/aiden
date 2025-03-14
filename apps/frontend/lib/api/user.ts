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
  phone_number?: string | null
  username?: string | null
}

interface UserBase extends UserUpdate{
  dynamic_id: string
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
    dynamic_id: user.userId,
    email: user.email,
    phone_number: user.phoneNumber,
    username: user.username,
  }
}

async function getUser(query: {user_id: string}): Promise<User>;
async function getUser(query: {public_key: string}): Promise<User>;
async function getUser(query: {dynamic_id: string}): Promise<User>;
async function getUser(query: {
  user_id: string,
} | {
  public_key: string,
} | {
  dynamic_id: string,
}): Promise<User> {
  return getResource<User>(
    baseUrlPath,
    { query: new URLSearchParams(query) },
  )
}

async function createUser(userPayload: UserBase): Promise<User> {
  return createResource<User, UserBase>(baseUrlPath, userPayload)
}

async function getOrCreateUser(userPayload: UserBase): Promise<User> {
  try {
    return getUser(userPayload).catch(() => createUser(userPayload))
  } catch (error) {
    console.error(error)
  }
  throw new Error("Logic error, this should never be reached.")
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
  getOrCreateUser,
  getUser,
  updateUser,
}