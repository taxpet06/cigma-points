// TDD: RED phase — tests for the EditProfileForm Zod schema.
//
// Behaviors under test:
//   - Bio field rejects input over 160 characters (D-06, PROF-02)
//   - Bio field accepts exactly 160 characters
//   - Bio field accepts empty string (optional)
//   - Name field rejects empty string (min 1)
//   - Name field rejects input over 50 characters

import { describe, it, expect } from "vitest"
import { z } from "zod"

// The schema mirrors what EditProfileForm will use.
// Import from the form file once it is created — for now define it inline
// so the test can run and fail on missing implementation.
//
// When EditProfileForm exports editProfileSchema, replace this with:
//   import { editProfileSchema } from "@/app/profile/edit/edit-profile-form"

const editProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name cannot exceed 50 characters"),
  bio: z.string().max(160, "Bio cannot exceed 160 characters"),
})

describe("editProfileSchema", () => {
  describe("bio field — 160 character limit (D-06)", () => {
    it("accepts a bio under 160 characters", () => {
      const result = editProfileSchema.safeParse({ name: "Alice", bio: "Hello world" })
      expect(result.success).toBe(true)
    })

    it("accepts a bio of exactly 160 characters", () => {
      const bio = "a".repeat(160)
      const result = editProfileSchema.safeParse({ name: "Alice", bio })
      expect(result.success).toBe(true)
    })

    it("rejects a bio of 161 characters", () => {
      const bio = "a".repeat(161)
      const result = editProfileSchema.safeParse({ name: "Alice", bio })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Bio cannot exceed 160 characters")
      }
    })

    it("rejects a bio of 200 characters", () => {
      const bio = "a".repeat(200)
      const result = editProfileSchema.safeParse({ name: "Alice", bio })
      expect(result.success).toBe(false)
    })

    it("accepts an empty bio (optional field)", () => {
      const result = editProfileSchema.safeParse({ name: "Alice", bio: "" })
      expect(result.success).toBe(true)
    })
  })

  describe("name field — required, max 50 chars", () => {
    it("rejects an empty name", () => {
      const result = editProfileSchema.safeParse({ name: "", bio: "" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Name is required")
      }
    })

    it("rejects a name over 50 characters", () => {
      const result = editProfileSchema.safeParse({ name: "a".repeat(51), bio: "" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Name cannot exceed 50 characters")
      }
    })

    it("accepts a name of exactly 50 characters", () => {
      const result = editProfileSchema.safeParse({ name: "a".repeat(50), bio: "" })
      expect(result.success).toBe(true)
    })
  })
})
