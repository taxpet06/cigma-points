// Next.js edge middleware — auth gate + admin role guard.
// Pattern 4 from RESEARCH.md.
//
// AUTH-04: Non-ADMIN users are redirected away from /admin*.
// Unauthenticated users are redirected to /sign-in (except /sign-in and /sign-up).
//
// Security notes:
//   - T-01-06: middleware is the FIRST gate; requireAdmin() in Server Components
//     and tRPC procedures is the SECOND gate (Pitfall 4 — defense in depth).
//   - matcher excludes /api/auth/* (NextAuth's own handlers must be unrestricted)
//     and Next.js static internals. Other /api/* routes ARE covered so API-level
//     admin checks still pass through requireAdmin() on the server.

import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"

export default NextAuth(authConfig).auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const isAdmin = req.auth?.user?.role === "ADMIN"

  // Allow sign-in and sign-up pages through without authentication
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to sign-in
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  // AUTH-04: block non-admins from /admin routes (T-01-06)
  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
})

export const config = {
  // Exclude NextAuth's own handlers and Next.js static assets.
  // All other routes (pages + /api/*) are covered — admin tRPC still re-checks
  // server-side via requireAdmin() (Pitfall 4 compliance).
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
