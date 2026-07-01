// Shared Zod schemas for Task-related input validation.
// Single source of truth used by tRPC server-side input validation and client-side forms.
//
// Important: cpReward uses z.coerce.number() — HTML <input type="number"> delivers strings to
// react-hook-form; coerce handles string-to-number conversion on the client.
// Server-side (superjson over tRPC wire), the value arrives as a number — coerce is a no-op.
//
// Server-only fields excluded (mass-assignment guard):
//   createTaskSchema: adminId is set server-side from ctx.session.user.id — never from client input.
//   updateBalanceSchema: no reason/note field — D-06 (no audit trail model).

import { z } from "zod"

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(2000),
  // cpReward: coercion + int + min pattern — D-11: required >= 1 on task creation form
  cpReward: z.coerce.number().int().min(1, "CP reward must be at least 1"),
  mediaUrl: z.string().url().optional(),
  // adminId excluded — sourced from ctx.session.user.id server-side (mass-assignment guard)
})

export const updateBalanceSchema = z.object({
  userId: z.string().min(1),
  // Negative values allowed — settlement.ts already permits negative balances
  // via increment/decrement, so the admin path is consistent with that behavior.
  newBalance: z.number().int(),
  // No reason field — D-06 (no audit trail)
})

export const completeTaskSchema = z.object({
  taskId: z.string().min(1),
  replyId: z.string().min(1),
})
