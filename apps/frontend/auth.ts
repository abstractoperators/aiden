// https://next-auth.js.org/configuration/options
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { validateJWT } from "./lib/authHelpers";
import { NextResponse } from "next/server";
import { getOrCreateUser } from "./lib/api/user";

type User = {
  apiId: string;
  id: string;
  name: string;
  email: string;
  // Add other fields as needed
};

export const config = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      authorize: async (
        credentials: Partial<Record<"token", unknown>>,
      ) => {
        const token = credentials.token as string; // Safely cast to string; ensure to handle undefined case
        if (typeof token !== "string" || !token) {
          throw new Error("Token is required");
        }

        const dynamicJwtPayload = await validateJWT(token);
        const blockChainCredentials = dynamicJwtPayload?.verified_credentials.filter(credential =>
          credential.format === 'blockchain'
        )

        console.debug("Credentials filtered for blockchain", blockChainCredentials)

        const apiUserPayload = {
          public_key: blockChainCredentials?.find(credential => 
            credential.chain === 'eip155'
          )?.address ?? "",
          public_key_sei: blockChainCredentials?.find(credential => 
            credential.chain === 'cosmos'
          )?.address ?? "",
        }

        if (!(apiUserPayload.public_key && apiUserPayload.public_key_sei)) {
          console.error("API User Payload", apiUserPayload)
          throw new Error("While examining JWT Payload, user was found to not have both an EVM and SEI address!!!")
        }

        if (dynamicJwtPayload) {
          // Transform the JWT payload into your user object
          const apiUser = await getOrCreateUser(apiUserPayload)
          const user: User = {
            apiId: apiUser.id,
            id: dynamicJwtPayload.sub ?? "", // Assuming 'sub' is the user ID
            name: dynamicJwtPayload.name ?? "", // Replace with actual field from JWT payload
            email: dynamicJwtPayload.email ?? "", // Replace with actual field from JWT payload
            // Map other fields as needed
          };
          return user;
        } else {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    authorized: ({ request, auth }) => {
      const { pathname } = request.nextUrl;
      console.log(`pathname: ${pathname}`)
      console.log("auth:", auth)
      if (!auth) {
        console.log("unauthorized attempt to access path, returning to origin")
        return NextResponse.redirect(request.nextUrl.origin);
      }
      return !!auth;
    },
    jwt: ({ token, user }) => {
      if (user) {
        token.apiUserId = (user as User).apiId
      }
      return token
    },
    session: ({ session, token }) => {
      // TODO remove in favor of context/context provider
      // @ts-ignore
      session.user.apiId = token.apiUserId 
      return session
    }
  },
  trustHost: true,
} satisfies NextAuthConfig

export type {
  User as SessionUser
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)
