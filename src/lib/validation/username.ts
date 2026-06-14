// Shared Zod schema for username validation.
// Single source of truth used by tRPC input validation and client-side RHF validation.
// Rules (Claude's discretion, per D-03): lowercase alphanumeric + underscores, 3-20 chars.

import { z } from "zod"

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username cannot exceed 20 characters")
  .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores allowed")
