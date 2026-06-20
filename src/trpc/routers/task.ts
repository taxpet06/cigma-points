// Task tRPC router — data layer for Phase 6 Task Posts.
//
// Procedures:
//   createTask     — creates a new Task Post; admin-only; adminId from session (never input)
//   getTasks       — returns all tasks ordered by recency; any authenticated user
//   getTask        — returns a single task by id; any authenticated user
//   getTaskReplies — returns all replies for a task with nested completion status
//   completeTask   — marks a task reply as complete and awards CP; admin-only; atomic $transaction
//
// Security:
//   T-6-01 — createTask + completeTask: ctx.session.user.role !== "ADMIN" → TRPCError FORBIDDEN
//             NEVER use requireAdmin() inside tRPC (Pitfall 3 — calls redirect())
//   T-6-02 — completeTask: idempotency guard — existing AWARDED status → BAD_REQUEST (Pitfall 2)
//   T-6-03 — completeTask: db.$transaction wraps upsert + increment (atomicity, Pattern 2)
//   T-6-04 — createTask: adminId = ctx.session.user.id (never from input — mass-assignment guard)
//   T-6-06 — all procedures: protectedProcedure throws UNAUTHORIZED before DB access

import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "@/trpc/init"
import { db } from "@/lib/db"
import { createTaskSchema, completeTaskSchema } from "@/lib/validation/task"

export const taskRouter = createTRPCRouter({
  /**
   * Creates a new Task Post.
   * Admin-only. adminId is always sourced from ctx.session.user.id — never from client input.
   *
   * Security:
   * - FORBIDDEN thrown for non-admin sessions (T-6-01)
   * - adminId = ctx.session.user.id (mass-assignment guard, T-6-04)
   */
  createTask: protectedProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only." })
      }
      const adminId = ctx.session.user.id // never from client input (T-6-04)
      return db.task.create({
        data: {
          adminId,
          title: input.title,
          description: input.description,
          cpReward: input.cpReward,
          mediaUrl: input.mediaUrl ?? null,
        },
        select: { id: true, createdAt: true },
      })
    }),

  /**
   * Returns all tasks, ordered by recency (newest first).
   * Any authenticated user can view tasks (TASK-01).
   */
  getTasks: protectedProcedure.query(async () => {
    return db.task.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        cpReward: true,
        mediaUrl: true,
        createdAt: true,
        admin: { select: { id: true, name: true, image: true } },
        _count: { select: { replies: true } },
      },
    })
  }),

  /**
   * Returns a single task by id.
   * Any authenticated user can view tasks.
   */
  getTask: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const task = await db.task.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          title: true,
          description: true,
          cpReward: true,
          mediaUrl: true,
          createdAt: true,
          admin: { select: { id: true, name: true, image: true } },
        },
      })
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." })
      }
      return task
    }),

  /**
   * Returns all replies for a task, oldest-first, with nested completion status.
   * Completion status is fetched via author.taskCompletions filtered to this task (Pattern 5).
   * TaskCompletion is keyed on (taskId, userId) — not (taskId, replyId) — so status is per user per task.
   *
   * Security:
   * - protectedProcedure throws UNAUTHORIZED before any DB access (T-6-06)
   */
  getTaskReplies: protectedProcedure
    .input(z.object({ taskId: z.string().min(1) }))
    .query(async ({ input }) => {
      return db.reply.findMany({
        where: { taskId: input.taskId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          content: true,
          mediaUrl: true,
          createdAt: true,
          parentId: true,
          taskId: true,
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              username: true,
              taskCompletions: {
                where: { taskId: input.taskId },
                select: { status: true, awardedCp: true },
              },
            },
          },
        },
      })
    }),

  /**
   * Marks a task reply as complete and awards CP to the reply author.
   * Admin-only. Atomic: upserts TaskCompletion + increments cigmaPoints in an interactive
   * $transaction so the idempotency check and the balance increment are serialized under
   * the same DB transaction, preventing TOCTOU double-awards from concurrent admin sessions.
   *
   * Security:
   * - FORBIDDEN thrown for non-admin sessions (T-6-01)
   * - Idempotency guard inside the transaction — existing AWARDED status → return false (T-6-02, Pitfall 2)
   * - db.$transaction(async tx => …) ensures atomicity + cross-request isolation (T-6-03, CR-03)
   * - userId derived from reply.authorId (fetched from DB), never from client input
   */
  completeTask: protectedProcedure
    .input(completeTaskSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only." })
      }

      const task = await db.task.findUnique({
        where: { id: input.taskId },
        select: { id: true, cpReward: true },
      })
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." })
      }
      if (task.cpReward == null) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Task has no CP reward." })
      }

      const reply = await db.reply.findUnique({
        where: { id: input.replyId },
        select: { id: true, authorId: true, taskId: true },
      })
      if (!reply || reply.taskId !== input.taskId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reply not found." })
      }

      // Interactive transaction: idempotency check + upsert + increment are all atomic.
      // Concurrent admin sessions both pass a check-outside-transaction scenario (TOCTOU, CR-03);
      // moving the guard inside the transaction and relying on the unique(taskId, userId)
      // constraint serializes concurrent creates correctly (T-6-03).
      const awarded = await db.$transaction(async (tx) => {
        const existing = await tx.taskCompletion.findUnique({
          where: { taskId_userId: { taskId: input.taskId, userId: reply.authorId } },
          select: { status: true },
        })
        if (existing?.status === "AWARDED") {
          return false // already done — caller throws BAD_REQUEST
        }

        await tx.taskCompletion.upsert({
          where: { taskId_userId: { taskId: input.taskId, userId: reply.authorId } },
          update: { status: "AWARDED", awardedCp: task.cpReward },
          create: {
            taskId: input.taskId,
            userId: reply.authorId,
            status: "AWARDED",
            awardedCp: task.cpReward,
          },
        })
        await tx.user.update({
          where: { id: reply.authorId },
          data: { cigmaPoints: { increment: task.cpReward } },
          select: { id: true, cigmaPoints: true },
        })
        return true
      })

      if (!awarded) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already awarded." })
      }

      return { awarded: true }
    }),
})
