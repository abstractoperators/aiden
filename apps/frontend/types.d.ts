import type { User } from "next-auth"
declare module "next-auth" {
  interface User {
    id: string
    token: string
    scopes?: string
  }
}

import type { JWT } from "next-auth/jwt"
declare module "next-auth/jwt" {
  interface JWT {
    token: string
    scopes?: string
  }
}

import type { JwtPayload } from "jsonwebtoken"
declare module "jsonwebtoken" {
  interface JwtPayload {
    username?: string
    email?: string
    scope?: string
  }
}