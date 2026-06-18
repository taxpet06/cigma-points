// Settlement logic — pure function, no DB calls. Caller passes returned ops to db.$transaction([]).
import { db } from "@/lib/db"

type ExpiredPost = {
  id: string
  type: "AWARD" | "DEDUCT"
  cpAmount: number
  targetUserId: string
  votes: { type: "AGREE" | "DISAGREE" }[]
}

/**
 * settlePost — takes an expired post snapshot and returns an array of Prisma operations.
 * Rules (per D-01, D-02, D-04):
 *   - outcome is "Awarded" only when agreeCount > disagreeCount
 *   - outcome is "Rejected" for all other cases (tie, zero votes, disagrees >= agrees)
 *   - Awarded AWARD post → cigmaPoints increment on target user
 *   - Awarded DEDUCT post → cigmaPoints decrement on target user
 *   - Rejected post → post update only (no balance change)
 */
export function settlePost(
  post: ExpiredPost,
): ReturnType<typeof db.post.update>[] {
  if (post.cpAmount <= 0) {
    throw new Error(`settlePost: cpAmount must be positive, got ${post.cpAmount} for post ${post.id}`)
  }

  const agreeCount = post.votes.filter((v) => v.type === "AGREE").length
  const disagreeCount = post.votes.filter((v) => v.type === "DISAGREE").length

  const outcome = agreeCount > disagreeCount ? "Awarded" : "Rejected"

  const ops: ReturnType<typeof db.post.update>[] = [
    db.post.update({
      where: { id: post.id },
      data: { settled: true, outcome },
    }),
  ]

  if (outcome === "Awarded") {
    ops.push(
      db.user.update({
        where: { id: post.targetUserId },
        data: {
          cigmaPoints:
            post.type === "AWARD"
              ? { increment: post.cpAmount }
              : { decrement: post.cpAmount },
        },
      }) as unknown as ReturnType<typeof db.post.update>,
    )
  }

  return ops
}
