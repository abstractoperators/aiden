// https://next-auth.js.org/configuration/options
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { validateJWT } from "./lib/auth-helpers";
import { NextResponse } from "next/server";

type User = {
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

        const jwtPayload = await validateJWT(token);

        if (jwtPayload) {
          // Transform the JWT payload into your user object
          if (!jwtPayload.sub)
            throw new Error(`JWT ${jwtPayload} has no Dynamic ID!!!`)
          const user: User = {
            id: jwtPayload.sub, // Assuming 'sub' is the user ID
            name: jwtPayload.name ?? "", // Replace with actual field from JWT payload
            email: jwtPayload.email ?? "", // Replace with actual field from JWT payload
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
      console.log("pathname:", pathname)
      console.log("cookies", request.cookies.getAll())
      console.log("auth:", auth)
      if (!auth) {
        console.log("unauthorized attempt to access path, returning to origin")
        return NextResponse.redirect(request.nextUrl.origin);
      }
      return !!auth;
    },
    session: ({ session, token }) => {
      session.user.id = token.sub ?? "" 
      return session
    }
  },
  trustHost: true,
} satisfies NextAuthConfig

export type {
  User as SessionUser
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)
