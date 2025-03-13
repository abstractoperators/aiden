'use server'

import { UserProfile } from "@dynamic-labs/sdk-react-core";
import { createResource, fromApiEndpoint, getResource } from "./common";
import { WalletBase } from "./wallet";

const USER_PATH = '/users'
const USER_SEGMENT = '/users/'

const baseUrlPath = fromApiEndpoint(USER_PATH)
// const baseUrlSegment = fromApiEndpoint(USER_SEGMENT)

interface UserBase {
  dynamic_id: string
  email?: string | null
  phone_number?: string | null
  username?: string | null
}

interface User extends UserBase {
  id: string
  wallets: WalletBase[]
}

async function getUser(options: {user_id: string}): Promise<User>;
async function getUser(options: {public_key: string}): Promise<User>;
async function getUser(options: {dynamic_id: string}): Promise<User>;
async function getUser(options: {
  user_id?: string,
  public_key?: string,
  dynamic_id?: string,
}): Promise<User> {
  return getResource<User>(
    baseUrlPath,
    { query: new URLSearchParams(options) },
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

export {
  createUser,
  dynamicToApiUser,
  getOrCreateUser,
}