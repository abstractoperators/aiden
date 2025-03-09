// https://next-auth.js.org/configuration/options
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { validateJWT } from "./lib/authHelpers";
import { NextResponse } from "next/server";

type User = {
  id: string;
  name: string;
  email: string;
  scopes: string[];
  // Add other fields as needed
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      authorize: async (credentials) => {
        const token = credentials.token as string; // Safely cast to string; ensure to handle undefined case
        if (typeof token !== "string" || !token) {
          throw new Error("Token is required");
        }
        const jwtPayload = await validateJWT(token);

        if (jwtPayload) {
          // Transform the JWT payload into your user object
          const user: User = {
            id: jwtPayload.sub ?? "", // Assuming 'sub' is the user ID
            name: jwtPayload.name ?? "", // Replace with actual field from JWT payload
            email: jwtPayload.email ?? "", // Replace with actual field from JWT payload
            scopes: jwtPayload.scopes ?? [], // Add the scopes to the user object
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
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      console.log(`pathname: ${pathname}`)
      if (!auth)
        return NextResponse.redirect(request.nextUrl.origin);
      return !!auth;
    },
  },
  trustHost: true,
})