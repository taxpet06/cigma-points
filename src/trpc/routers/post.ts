// Post tRPC router — data layer for Phase 3.
//
// Procedures:
//   createPost    — creates an AWARD or DEDUCT post; authorId always from session (never client input)
//   getFeed       — cursor-based paginated feed of AWARD + DEDUCT posts ordered by createdAt desc
//   searchUsers   — debounced autocomplete search; excludes self; searches name and username
//
// Security:
//   T-03-01 — createPost: authorId = ctx.session.user.id (never from client input)
//   T-03-02 — createPost: self-nomination guard (targetUserId === authorId → BAD_REQUEST)
//   T-03-03 — createPost: target user verified to exist and have a username before db.post.create
//   T-03-04 — createPost: votingEndsAt set server-side (Date.now() + 24h); absent from input schema
//   T-03-05 — getFeed / searchUsers: protectedProcedure — UNAUTHORIZED before any DB access
//   T-03-06 — searchUsers: excludes self (id: { not: callerId })

import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "@/trpc/init"
import { db } from "@/lib/db"
import { createPostSchema } from "@/lib/validation/post"
import { castVoteSchema, retractVoteSchema } from "@/lib/validation/vote"

export const postRouter = createTRPCRouter({
  /**
   * Creates an AWARD or DEDUCT post.
   *
   * Security:
   * - authorId is always sourced from ctx.session.user.id — never from client input (T-03-01)
   * - Self-nomination is blocked server-side before any DB write (T-03-02)
   * - Target user must exist and have a claimed username (T-03-03)
   * - votingEndsAt is computed server-side as Date.now() + 24h (T-03-04)
   * - createPostSchema excludes settled, outcome, votingEndsAt, authorId (mass-assignment guard)
   */
  createPost: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.session.user.id

      // Dedupe target ids — the UI shouldn't submit duplicates, but guard anyway
      // so the @@unique([postId, userId]) constraint can never reject the create.
      const targetIds = [...new Set(input.targetUserIds)]

      // Server-side self-nomination block (T-03-02 / D-09) — applies to every target.
      if (targetIds.includes(authorId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot nominate yourself.",
        })
      }

      // Verify EVERY target user exists and has a claimed username (T-03-03 / D-10).
      const targetUsers = await db.user.findMany({
        where: { id: { in: targetIds }, username: { not: null } },
        select: { id: true },
      })
      if (targetUsers.length !== targetIds.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or more target users were not found.",
        })
      }

      // votingEndsAt is server-set — never from client input (T-03-04 / D-11)
      const votingEndsAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      return db.post.create({
        data: {
          authorId,
          type: input.type,
          title: input.title,
          explanation: input.explanation,
          cpAmount: input.cpAmount,
          mediaUrl: input.mediaUrl ?? null,
          votingEndsAt,
          targets: { create: targetIds.map((userId) => ({ userId })) },
        },
        // Explicit select — never return sensitive fields (T-03-01 guard)
        select: { id: true, createdAt: true },
      })
    }),

  /**
   * Returns cursor-based paginated feed of AWARD and DEDUCT posts ordered by createdAt desc.
   * Mirrors the getPostHistory cursor pattern from user.ts (take: limit+1, pop for nextCursor).
   * TASK posts are excluded from the feed (handled separately in Phase 6).
   * explanation included in select for PostCard preview — zero-cost, avoids a future schema change.
   */
  getFeed: protectedProcedure
    .input(
      z.object({
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const callerId = ctx.session.user.id
      const { cursor, limit } = input

      const items = await db.post.findMany({
        where: { type: { in: ["AWARD", "DEDUCT"] } },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          title: true,
          explanation: true,
          cpAmount: true,
          mediaUrl: true,
          outcome: true,
          settled: true,
          votingEndsAt: true,
          createdAt: true,
          author: { select: { id: true, name: true, image: true, username: true } },
          targets: { select: { user: { select: { id: true, name: true, image: true, username: true } } } },
          votes: { select: { type: true, userId: true } },
          _count: { select: { replies: true } },
        },
      })

      // Cursor pagination: if we got more than limit, pop the extra item and use its id as nextCursor
      let nextCursor: string | undefined
      if (items.length > limit) {
        const nextItem = items.pop()!
        nextCursor = nextItem.id
      }

      // Compute vote counts and current-user vote state JS-side.
      // Raw votes array is stripped from the return — only agreeCount, disagreeCount,
      // and userVote (the caller's own vote row or null) are exposed to clients.
      // This prevents leaking the full voter list (Information Disclosure — threat model).
      // targets is flattened from [{ user }] to [user] so PostCard consumes a plain user list.
      const mapped = items.map((post) => {
        const { votes, targets, ...rest } = post
        return {
          ...rest,
          targets: targets.map((t) => t.user),
          agreeCount: votes.filter((v) => v.type === "AGREE").length,
          disagreeCount: votes.filter((v) => v.type === "DISAGREE").length,
          userVote: votes.find((v) => v.userId === callerId) ?? null,
        }
      })

      return { items: mapped, nextCursor }
    }),

  /**
   * Returns cursor-based paginated feed of posts where the caller is one of the target users.
   * Same shape as getFeed so PostCard can be reused without modification.
   */
  getTaggedFeed: protectedProcedure
    .input(
      z.object({
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const callerId = ctx.session.user.id
      const { cursor, limit } = input

      const items = await db.post.findMany({
        where: { targets: { some: { userId: callerId } }, type: { in: ["AWARD", "DEDUCT"] } },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          title: true,
          explanation: true,
          cpAmount: true,
          mediaUrl: true,
          outcome: true,
          settled: true,
          votingEndsAt: true,
          createdAt: true,
          author: { select: { id: true, name: true, image: true, username: true } },
          targets: { select: { user: { select: { id: true, name: true, image: true, username: true } } } },
          votes: { select: { type: true, userId: true } },
          _count: { select: { replies: true } },
        },
      })

      let nextCursor: string | undefined
      if (items.length > limit) {
        const nextItem = items.pop()!
        nextCursor = nextItem.id
      }

      const mapped = items.map((post) => {
        const { votes, targets, ...rest } = post
        return {
          ...rest,
          targets: targets.map((t) => t.user),
          agreeCount: votes.filter((v) => v.type === "AGREE").length,
          disagreeCount: votes.filter((v) => v.type === "DISAGREE").length,
          userVote: votes.find((v) => v.userId === callerId) ?? null,
        }
      })

      return { items: mapped, nextCursor }
    }),

  /**
   * Returns autocomplete results for target user selection.
   * Excludes the calling user (T-03-06 / D-09). Searches by display name and username
   * (case-insensitive LIKE query). Users without a claimed username are included — they
   * appear by display name only. Capped at 8 results for autocomplete dropdown performance.
   *
   * Performance note: `contains: mode: "insensitive"` generates ILIKE '%query%'. At MVP scale
   * (hundreds of users) this is acceptable. If the user base grows to tens of thousands, add
   * a @@index([name, username]) or switch to Postgres full-text search.
   */
  searchUsers: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const callerId = ctx.session.user.id

      return db.user.findMany({
        where: {
          AND: [
            { id: { not: callerId } }, // exclude self (T-03-06 / D-09)
            {
              OR: [
                { name: { contains: input.query, mode: "insensitive" } },
                { username: { contains: input.query, mode: "insensitive" } },
              ],
            },
          ],
        },
        take: 8, // cap results for autocomplete dropdown
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
        orderBy: { name: "asc" },
      })
    }),

  /**
   * Casts or flips an agree/disagree vote on a post.
   *
   * Security:
   * - userId always from ctx.session.user.id — never from client input (Spoofing)
   * - Self-vote blocked server-side (Elevation of Privilege)
   * - Voting window enforced server-side (Tampering)
   * - Upsert on @@unique([postId, userId]) prevents duplicate votes (Tampering)
   * - castVoteSchema excludes settled, outcome, votingEndsAt (mass-assignment guard)
   */
  castVote: protectedProcedure
    .input(castVoteSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const post = await db.post.findUnique({
        where: { id: input.postId },
        select: { authorId: true, votingEndsAt: true, settled: true },
      })

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found." })
      }

      if (post.settled || post.votingEndsAt <= new Date()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Voting is closed for this post." })
      }

      if (post.authorId === userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot vote on your own post." })
      }

      return db.vote.upsert({
        where: { postId_userId: { postId: input.postId, userId } },
        update: { type: input.type },
        create: { postId: input.postId, userId, type: input.type },
      })
    }),

  /**
   * Retracts a user's vote on a post.
   *
   * Security:
   * - userId always from ctx.session.user.id — never from client input
   * - Voting window enforced server-side (Tampering)
   * - Uses deleteMany (not delete) — silently no-ops if vote row doesn't exist (Integrity)
   */
  retractVote: protectedProcedure
    .input(retractVoteSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Atomic: fold the settlement guard into the WHERE predicate so the
      // settled-check and the delete cannot be separated by the settlement cron.
      const result = await db.vote.deleteMany({
        where: {
          postId: input.postId,
          userId,
          post: { settled: false, votingEndsAt: { gt: new Date() } },
        },
      })

      if (result.count === 0) {
        // Distinguish "voting closed" from "no vote existed" so the client
        // gets the right error code.
        const post = await db.post.findUnique({
          where: { id: input.postId },
          select: { settled: true, votingEndsAt: true },
        })
        if (!post) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Post not found." })
        }
        if (post.settled || post.votingEndsAt <= new Date()) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Voting is closed for this post." })
        }
        // count=0 but voting is open — user had no vote to retract; silent no-op.
      }

      return { success: true }
    }),
})
