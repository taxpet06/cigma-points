// Cron settlement route — called by cron-job.org every 15 minutes.
// Vercel Hobby plan only supports once-daily cron jobs, so external scheduling
// via cron-job.org (free tier) is used instead of vercel.json crons.
// Authorization: Bearer ${CRON_SECRET} header required — set in cron-job.org job config.

import { after } from "next/server"
import { db } from "@/lib/db"
import { settlePost } from "@/lib/settlement"
import { notifyCpChange } from "@/lib/notifications"

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  const secret = authHeader?.replace("Bearer ", "")
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 })
  }

  const now = new Date()

  const expiredPosts = await db.post.findMany({
    where: {
      settled: false,
      votingEndsAt: { lte: now },
      type: { in: ["AWARD", "DEDUCT"] },
    },
    select: {
      id: true,
      type: true,
      cpAmount: true,
      targets: { select: { userId: true } },
      votes: { select: { type: true } },
    },
  })

  if (expiredPosts.length === 0) {
    return Response.json({ settled: 0 })
  }

  // Array-form $transaction — required for PrismaNeon HTTP adapter (no interactive callback form).
  // D-03: settle all expired posts in one batch; at MVP scale well within 10s Vercel timeout.
  // Cast type narrowly — the WHERE filter guarantees only AWARD/DEDUCT posts are returned.
  const ops = expiredPosts.flatMap((post) =>
    settlePost(post as typeof post & { type: "AWARD" | "DEDUCT" }),
  )
  await db.$transaction(ops)

  // Non-blocking: notify targets of Awarded posts after the response is sent (T-x04-02).
  // Recompute the Awarded outcome inline — same rule used in settlePost (agreeCount > disagreeCount).
  after(() => {
    for (const post of expiredPosts) {
      const agree = post.votes.filter((v) => v.type === "AGREE").length
      const disagree = post.votes.filter((v) => v.type === "DISAGREE").length
      if (agree > disagree) {
        for (const target of post.targets) {
          void notifyCpChange(target.userId)
        }
      }
    }
  })

  return Response.json({ settled: expiredPosts.length })
}
