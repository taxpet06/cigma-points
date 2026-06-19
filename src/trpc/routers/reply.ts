// Reply tRPC router — data layer for Phase 5 threaded replies.
//
// Procedures:
//   createReply — creates a reply on a post; authorId always from session (never client input)
//   getReplies  — flat fetch of all replies for a post, oldest-first; client builds tree from parentId
//
// Security:
//   T-05-01 — createReply: authorId = ctx.session.user.id (never from client input / mass-assignment guard)
//   T-05-02 — createReply + getReplies: protectedProcedure — UNAUTHORIZED thrown before any DB access
//   T-05-03 — createReply: NOT_FOUND guard — db.post.findUnique verifies postId exists before db.reply.create
//   T-05-04 — getReplies: explicit select — author limited to { id, name, image, username }; never returns email/password
//   T-05-05 — createReplySchema excludes authorId from shape; createReply never reads input.authorId

import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "@/trpc/init"
import { db } from "@/lib/db"
import { createReplySchema } from "@/lib/validation/reply"

export const replyRouter = createTRPCRouter({
  /**
   * Creates a reply on a post.
   *
   * Security:
   * - authorId is always sourced from ctx.session.user.id — never from client input (T-05-01)
   * - protectedProcedure throws UNAUTHORIZED before any DB access (T-05-02)
   * - postId verified to exist before db.reply.create — prevents orphaned reply rows (T-05-03)
   * - createReplySchema excludes authorId (mass-assignment guard — T-05-05)
   */
  createReply: protectedProcedure
    .input(createReplySchema)
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.session.user.id

      // Verify post exists before inserting the reply (T-05-03)
      const post = await db.post.findUnique({
        where: { id: input.postId },
        select: { id: true },
      })
      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found.",
        })
      }

      // Verify parentId exists and belongs to the same post (prevents cross-post parent refs)
      if (input.parentId) {
        const parent = await db.reply.findUnique({
          where: { id: input.parentId },
          select: { postId: true },
        })
        if (!parent || parent.postId !== input.postId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Parent reply not found." })
        }
      }

      // Explicit select on create — never return unneeded fields
      return db.reply.create({
        data: {
          postId: input.postId,
          parentId: input.parentId ?? null,
          authorId,
          content: input.content,
          mediaUrl: input.mediaUrl ?? null,
        },
        select: { id: true, createdAt: true },
      })
    }),

  /**
   * Returns all replies for a post, flat, oldest-first.
   * Client builds the visual tree from parentId references — no nested children include.
   *
   * Security:
   * - protectedProcedure throws UNAUTHORIZED before any DB access (T-05-02)
   * - Explicit Prisma select — author limited to { id, name, image, username }; never returns email (T-05-04)
   */
  getReplies: protectedProcedure
    .input(z.object({ postId: z.string().min(1) }))
    .query(async ({ input }) => {
      return db.reply.findMany({
        where: { postId: input.postId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          content: true,
          mediaUrl: true,
          createdAt: true,
          parentId: true,
          author: { select: { id: true, name: true, image: true, username: true } },
        },
      })
    }),
})
