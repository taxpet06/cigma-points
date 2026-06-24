import { describe, it, expect } from "vitest"
import { createPostSchema } from "@/lib/validation/post"

const valid = {
  type: "AWARD" as const,
  targetUserIds: ["user-123"],
  title: "Great work",
  explanation: "Did something excellent",
  cpAmount: 10,
}

describe("createPostSchema", () => {
  it("accepts a valid AWARD post", () => {
    expect(createPostSchema.safeParse(valid).success).toBe(true)
  })

  it("accepts a valid DEDUCT post", () => {
    expect(createPostSchema.safeParse({ ...valid, type: "DEDUCT" }).success).toBe(true)
  })

  it("accepts multiple target users (M-01)", () => {
    expect(
      createPostSchema.safeParse({ ...valid, targetUserIds: ["u1", "u2", "u3"] }).success
    ).toBe(true)
  })

  it("rejects an empty target list", () => {
    expect(createPostSchema.safeParse({ ...valid, targetUserIds: [] }).success).toBe(false)
  })

  it("rejects more than 20 target users", () => {
    const tooMany = Array.from({ length: 21 }, (_, i) => `u${i}`)
    expect(createPostSchema.safeParse({ ...valid, targetUserIds: tooMany }).success).toBe(false)
  })

  it("rejects an invalid type", () => {
    expect(createPostSchema.safeParse({ ...valid, type: "TASK" }).success).toBe(false)
  })

  it("coerces cpAmount from string '5' to number 5", () => {
    const result = createPostSchema.safeParse({ ...valid, cpAmount: "5" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.cpAmount).toBe(5)
  })

  it("rejects cpAmount of 0", () => {
    expect(createPostSchema.safeParse({ ...valid, cpAmount: 0 }).success).toBe(false)
  })

  it("rejects negative cpAmount", () => {
    expect(createPostSchema.safeParse({ ...valid, cpAmount: -1 }).success).toBe(false)
  })

  it("rejects non-integer cpAmount", () => {
    expect(createPostSchema.safeParse({ ...valid, cpAmount: 1.5 }).success).toBe(false)
  })

  it("rejects empty title", () => {
    expect(createPostSchema.safeParse({ ...valid, title: "" }).success).toBe(false)
  })

  it("rejects title over 100 characters", () => {
    expect(createPostSchema.safeParse({ ...valid, title: "a".repeat(101) }).success).toBe(false)
  })

  it("rejects empty explanation", () => {
    expect(createPostSchema.safeParse({ ...valid, explanation: "" }).success).toBe(false)
  })

  it("rejects explanation over 1000 characters", () => {
    expect(createPostSchema.safeParse({ ...valid, explanation: "a".repeat(1001) }).success).toBe(false)
  })

  it("accepts post without mediaUrl (mediaUrl is optional)", () => {
    const { mediaUrl: _, ...noMedia } = { ...valid, mediaUrl: undefined }
    expect(createPostSchema.safeParse(noMedia).success).toBe(true)
  })

  it("accepts a valid mediaUrl", () => {
    expect(createPostSchema.safeParse({ ...valid, mediaUrl: "https://utfs.io/f/abc123.jpg" }).success).toBe(true)
  })

  it("rejects an invalid mediaUrl", () => {
    expect(createPostSchema.safeParse({ ...valid, mediaUrl: "not-a-url" }).success).toBe(false)
  })

  it("does not expose server-only fields in schema shape", () => {
    const shape = createPostSchema.shape
    expect("settled" in shape).toBe(false)
    expect("outcome" in shape).toBe(false)
    expect("votingEndsAt" in shape).toBe(false)
    expect("authorId" in shape).toBe(false)
  })
})
