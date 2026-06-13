// tRPC v11 initialization — context, router factory, and procedure builders.
// Pattern 7 from RESEARCH.md.
//
// - createTRPCContext: reads the NextAuth session via auth() on every request
// - publicProcedure: open to anyone (unauthenticated calls allowed)
// - protectedProcedure: throws UNAUTHORIZED if no session user (T-01-10)

import { initTRPC, TRPCError } from "@trpc/server"
import { auth } from "@/auth"
import superjson from "superjson"

/**
 * Creates the tRPC context for each request.
 * Called by the HTTP route handler and the server-side caller.
 */
export const createTRPCContext = async () => {
  const session = await auth()
  return { session }
}

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
export const createCallerFactory = t.createCallerFactory

/**
 * protectedProcedure: throws UNAUTHORIZED when the caller has no valid session.
 * Narrows ctx.session so downstream procedures can safely access ctx.session.user.
 * Threat: T-01-10 — Elevation of Privilege via unauthenticated procedure call.
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  return next({
    ctx: {
      ...ctx,
      // session narrowed to non-null after the guard above
      session: ctx.session,
    },
  })
})
