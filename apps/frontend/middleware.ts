import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

const scopedRoutes: {
  path: string,
  requiredScopes: string[],
}[] = [
  { path: "/admin", requiredScopes: ["admin"] },
  { path: "/user", requiredScopes: ["create-agent"] },
  { path: "/user/agents/creation", requiredScopes: ["deploy-agent"] },
]

const get403Message = () => {
  return NextResponse.json(
    { error: "Forbidden: You don't have access to this page!" },
    { status: 403 },
  )
}

const temporaryCheckBackSoon = (req: NextRequest) => {
  return NextResponse.redirect(new URL('/signup', req.url))
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const auth = req.auth
  const consoleAuth = {
    expires: auth?.expires,
    user : {
      email: auth?.user?.email,
      id: auth?.user?.id,
      image: auth?.user?.image,
      name: auth?.user?.name,
      scopes: auth?.user?.scopes,
      token: auth?.user?.token.length,
    }
  }
  console.debug("pathname:", pathname)
  console.debug("auth:", consoleAuth)

  if (!auth || !auth.user) {
    console.debug(
      "User is trying to access protected route",
      pathname,
      "without any authorization!",
    )
    return NextResponse.json(
      { error: "Unauthorized: Log in to attempt access to this page!"},
      { status: 401 },
    )
  }

  for (const route of scopedRoutes) {
    const { path, requiredScopes } = route
    if (pathname.startsWith(path)) {
      // Check if the user has scopes
      if (!auth.user.scopes) {
        console.debug(
          "User is trying to access scoped route",
          pathname,
          "without any scopes!",
        )
        return temporaryCheckBackSoon(req)
        // return get403Message()
      } else {
        // Check if the user has at least one required scope
        const scopes = auth.user.scopes
        const hasScope = requiredScopes.some(scope =>
          scopes.includes(scope)
        );

        if (!hasScope) {
          console.debug("User does not have any scope to access route", pathname)
          return temporaryCheckBackSoon(req)
          // return get403Message()
        }
      }
    }
  }
})

export const config = {
  matcher: [
    "/admin/:path*",
    "/user/:path*",
  ],
}