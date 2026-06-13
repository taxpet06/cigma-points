// User tRPC router — Walking Skeleton DB read.
// user.getMe: first real DB-backed tRPC procedure (proves DB -> tRPC -> UI chain).
//
// Security (T-01-12 — Information Disclosure):
//   getMe select excludes the password field; returns only safe profile fields.

import { createTRPCRouter, protectedProcedure } from "@/trpc/init"
import { db } from "@/lib/db"

export const userRouter = createTRPCRouter({
  /**
   * Returns the current signed-in user's profile from the database.
   * Requires a valid session (protectedProcedure — T-01-10).
   * Password is excluded from the select (T-01-12).
   */
  getMe: protectedProcedure.query(async ({ ctx }) => {
    return db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cigmaPoints: true,
        image: true,
        bio: true,
      },
    })
  }),
})
