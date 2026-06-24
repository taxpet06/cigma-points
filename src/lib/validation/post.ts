// Shared Zod schema for createPost input validation.
// Single source of truth used by tRPC server-side input validation and client-side RHF validation.
//
// Important: cpAmount uses z.coerce.number() — HTML <input type="number"> delivers strings to
// react-hook-form; coerce handles string-to-number conversion on the client.
// Server-side (superjson over tRPC wire), the value arrives as a number — coerce is a no-op.
//
// Server-only fields excluded (mass-assignment guard): settled, outcome, votingEndsAt, authorId.
// These are set server-side in the createPost procedure and must never appear in client input.

import { z } from "zod"

export const createPostSchema = z.object({
  type: z.enum(["AWARD", "DEDUCT"]),
  // One or more target users (M-01). Each target receives cpAmount individually on settlement.
  targetUserIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one target user")
    .max(20, "A post can target at most 20 users"),
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or fewer"),
  explanation: z
    .string()
    .trim()
    .min(1, "Explanation is required")
    .max(1000, "Explanation must be 1000 characters or fewer"),
  cpAmount: z
    .coerce
    .number()
    .int("CP amount must be a whole number")
    .min(1, "CP amount must be at least 1"),
  mediaUrl: z.string().url().optional(),
})
