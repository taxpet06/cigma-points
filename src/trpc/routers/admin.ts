// Admin tRPC router — user management procedures for Phase 6.
//
// Procedures:
//   getAllUsers   — returns all users with explicit select (no password); admin-only
//   updateBalance — sets a user's cigmaPoints to a new value; admin-only
//
// Security:
//   T-6-01 — All procedures: ctx.session.user.role !== "ADMIN" → TRPCError FORBIDDEN
//             NEVER use requireAdmin() inside tRPC (it calls redirect() → crashes tRPC, Pitfall 3)
//   T-6-05 — getAllUsers explicit select excludes password/accounts/sessions (Information Disclosure guard)

import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "@/trpc/init"
import { db } from "@/lib/db"
import { updateBalanceSchema } from "@/lib/validation/task"

export const adminRouter = createTRPCRouter({
  /**
   * Returns all users with public fields — no password or auth relations.
   * Admin-only. Ordered by createdAt asc.
   *
   * Security:
   * - FORBIDDEN thrown for non-admin sessions (T-6-01)
   * - Explicit select excludes password, accounts, sessions (T-6-05 / D-05)
   */
  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin only." })
    }
    return db.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        cigmaPoints: true,
        role: true,
        createdAt: true,
        // password excluded — D-05 + Information Disclosure guard (T-6-05)
        // accounts, sessions excluded — T-6-05
      },
    })
  }),

  /**
   * Sets a user's cigmaPoints to a new value.
   * Admin-only. No reason field (D-06 — no audit trail model).
   *
   * Security:
   * - FORBIDDEN thrown for non-admin sessions (T-6-01)
   * - Target user existence verified before update (NOT_FOUND guard)
   */
  updateBalance: protectedProcedure
    .input(updateBalanceSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only." })
      }
      // Verify target user exists
      const target = await db.user.findUnique({
        where: { id: input.userId },
        select: { id: true },
      })
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." })
      }
      return db.user.update({
        where: { id: input.userId },
        data: { cigmaPoints: input.newBalance },
        select: { id: true, cigmaPoints: true },
      })
    }),
})
