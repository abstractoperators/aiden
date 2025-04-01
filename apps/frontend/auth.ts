// https://next-auth.js.org/configuration/options
import NextAuth from "next-auth";
import type { NextAuthConfig, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { validateJWT } from "./lib/auth-helpers";

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

        const jwtPayload = await validateJWT(token);

        if (jwtPayload) {
          // Transform the JWT payload into your user object
          if (!jwtPayload.sub)
            throw new Error(`JWT ${jwtPayload} has no Dynamic ID!!!`)
          const user: User = {
            id: jwtPayload.sub, // Assuming 'sub' is the user ID
            name: jwtPayload.username,
            email: jwtPayload.email,
            scopes: jwtPayload.scope,
            token: token.trim(),
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
    jwt: ({ token, user }) => {
      if (user) {
        token.scopes = user.scopes
        token.token = user.token
      }
      return token
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? "" 
        session.user.scopes = token.scopes
        session.user.token = token.token
      }
      return session
    }
  },
  trustHost: true,
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)