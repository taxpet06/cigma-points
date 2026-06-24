import { describe, it, expect, vi } from "vitest"

// Mock the db module — settlePost just builds the ops array, so mocks return identifiable objects.
vi.mock("@/lib/db", () => ({
  db: {
    post: {
      update: vi.fn((args) => ({ ...args, __op: "post.update" })),
    },
    user: {
      update: vi.fn((args) => ({ ...args, __op: "user.update" })),
    },
  },
}))

import { settlePost } from "@/lib/settlement"

type MockOp = {
  __op: string
  where: { id?: string }
  data: {
    settled?: boolean
    outcome?: string
    cigmaPoints?: { increment?: number; decrement?: number }
  }
}

function makePost(overrides: {
  type?: "AWARD" | "DEDUCT"
  cpAmount?: number
  targets?: { userId: string }[]
  votes?: { type: "AGREE" | "DISAGREE" }[]
}) {
  return {
    id: "post-1",
    type: (overrides.type ?? "AWARD") as "AWARD" | "DEDUCT",
    cpAmount: overrides.cpAmount ?? 10,
    targets: overrides.targets ?? [{ userId: "user-target" }],
    votes: overrides.votes ?? [],
  }
}

describe("settlePost", () => {
  it("agrees > disagrees → Awarded, 2 ops (post update + balance)", () => {
    const post = makePost({
      type: "AWARD",
      cpAmount: 10,
      votes: [
        { type: "AGREE" },
        { type: "AGREE" },
        { type: "AGREE" },
        { type: "DISAGREE" },
      ],
    })
    const ops = settlePost(post) as unknown as MockOp[]
    expect(ops).toHaveLength(2)
    expect(ops[0].__op).toBe("post.update")
    expect(ops[0].data.outcome).toBe("Awarded")
    expect(ops[0].data.settled).toBe(true)
    expect(ops[1].__op).toBe("user.update")
    expect(ops[1].data.cigmaPoints?.increment).toBe(10)
  })

  it("tie (agrees === disagrees) → Rejected, 1 op (post update only)", () => {
    const post = makePost({
      votes: [
        { type: "AGREE" },
        { type: "AGREE" },
        { type: "DISAGREE" },
        { type: "DISAGREE" },
      ],
    })
    const ops = settlePost(post) as unknown as MockOp[]
    expect(ops).toHaveLength(1)
    expect(ops[0].data.outcome).toBe("Rejected")
  })

  it("zero votes → Rejected, 1 op", () => {
    const post = makePost({ votes: [] })
    const ops = settlePost(post) as unknown as MockOp[]
    expect(ops).toHaveLength(1)
    expect(ops[0].data.outcome).toBe("Rejected")
  })

  it("disagrees > agrees → Rejected, 1 op", () => {
    const post = makePost({
      votes: [
        { type: "AGREE" },
        { type: "DISAGREE" },
        { type: "DISAGREE" },
        { type: "DISAGREE" },
      ],
    })
    const ops = settlePost(post) as unknown as MockOp[]
    expect(ops).toHaveLength(1)
    expect(ops[0].data.outcome).toBe("Rejected")
  })

  it("AWARD Awarded → cigmaPoints increment", () => {
    const post = makePost({
      type: "AWARD",
      cpAmount: 25,
      votes: [{ type: "AGREE" }, { type: "AGREE" }, { type: "DISAGREE" }],
    })
    const ops = settlePost(post) as unknown as MockOp[]
    expect(ops).toHaveLength(2)
    expect(ops[1].data.cigmaPoints).toHaveProperty("increment", 25)
    expect(ops[1].data.cigmaPoints).not.toHaveProperty("decrement")
  })

  it("DEDUCT Awarded → cigmaPoints decrement", () => {
    const post = makePost({
      type: "DEDUCT",
      cpAmount: 15,
      votes: [{ type: "AGREE" }, { type: "AGREE" }, { type: "DISAGREE" }],
    })
    const ops = settlePost(post) as unknown as MockOp[]
    expect(ops).toHaveLength(2)
    expect(ops[1].data.cigmaPoints).toHaveProperty("decrement", 15)
    expect(ops[1].data.cigmaPoints).not.toHaveProperty("increment")
  })

  it("Rejected → no balance op (ops.length 1)", () => {
    const post = makePost({
      votes: [{ type: "DISAGREE" }],
    })
    const ops = settlePost(post) as unknown as MockOp[]
    expect(ops).toHaveLength(1)
    expect(ops[0].data.outcome).toBe("Rejected")
  })

  it("multi-target AWARD Awarded → 1 post update + one balance op per target, each +cpAmount (M-01)", () => {
    const post = makePost({
      type: "AWARD",
      cpAmount: 10,
      targets: [{ userId: "u1" }, { userId: "u2" }, { userId: "u3" }],
      votes: [{ type: "AGREE" }, { type: "AGREE" }, { type: "DISAGREE" }],
    })
    const ops = settlePost(post) as unknown as MockOp[]
    expect(ops).toHaveLength(4) // 1 post.update + 3 user.update
    expect(ops[0].__op).toBe("post.update")
    const balanceOps = ops.slice(1)
    expect(balanceOps.map((o) => o.where.id)).toEqual(["u1", "u2", "u3"])
    for (const op of balanceOps) {
      expect(op.__op).toBe("user.update")
      expect(op.data.cigmaPoints).toHaveProperty("increment", 10)
    }
  })

  it("multi-target Rejected → no balance ops regardless of target count (M-01)", () => {
    const post = makePost({
      targets: [{ userId: "u1" }, { userId: "u2" }],
      votes: [{ type: "DISAGREE" }],
    })
    const ops = settlePost(post) as unknown as MockOp[]
    expect(ops).toHaveLength(1)
    expect(ops[0].data.outcome).toBe("Rejected")
  })
})
