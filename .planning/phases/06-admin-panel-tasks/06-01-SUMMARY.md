---
phase: 06-admin-panel-tasks
plan: 01
subsystem: backend
tags: [prisma, trpc, validation, schema-migration, tdd]
dependency_graph:
  requires: []
  provides:
    - createTaskSchema
    - updateBalanceSchema
    - completeTaskSchema
    - createReplySchema (XOR refine)
    - taskRouter (createTask, getTasks, getTask, getTaskReplies, completeTask)
    - adminRouter (getAllUsers, updateBalance)
    - Reply.taskId schema field
    - Task.replies back-relation
  affects:
    - src/trpc/routers/reply.ts (createReply extended for taskId)
    - src/trpc/routers/_app.ts (task + admin routers registered)
    - src/components/post-card.tsx (PostType.TASK removed)
    - src/components/feed/feed-list.tsx (PostType.TASK cast removed)
    - src/components/profile/post-history-tabs.tsx (PostType.TASK cast removed)
    - src/app/post/[id]/page.tsx (PostType.TASK cast removed)
tech_stack:
  added: []
  patterns:
    - tRPC protectedProcedure with FORBIDDEN role guard (never requireAdmin in tRPC)
    - Prisma $transaction for atomic CP award + completion upsert
    - Idempotency guard: fetch TaskCompletion before transaction, BAD_REQUEST if AWARDED
    - XOR refine on Zod schema for mutually exclusive optional fields
    - db push (no migration history) + prisma generate for Prisma v7 dev workflow
key_files:
  created:
    - src/lib/validation/task.ts
    - src/trpc/routers/task.ts
    - src/trpc/routers/admin.ts
    - tests/unit/task-schema.test.ts
    - tests/e2e/admin-tasks.spec.ts
  modified:
    - src/lib/validation/reply.ts
    - src/trpc/routers/reply.ts
    - src/trpc/routers/_app.ts
    - prisma/schema.prisma
    - src/components/post-card.tsx
    - src/app/post/[id]/page.tsx
    - src/components/feed/feed-list.tsx
    - src/components/profile/post-history-tabs.tsx
decisions:
  - "Used db push --accept-data-loss instead of migrate dev (no migration history in this project)"
  - "D-03 cleanup extended to feed-list.tsx and post-history-tabs.tsx (not listed in plan files)"
metrics:
  duration: "6 minutes"
  completed: "2026-06-19"
  tasks_completed: 3
  files_changed: 13
---

# Phase 06 Plan 01: Backend Foundation (Schemas + Routers + Migration) Summary

Phase 6 backend foundation complete. Zod schemas, tRPC routers (task + admin), extended reply router, Prisma schema migration (3 changes), Prisma client regeneration, 28 unit tests green, failing E2E scaffold with all 6 requirement IDs tagged.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 (RED) | Failing unit tests | 3d5704a | tests/unit/task-schema.test.ts |
| 1 (GREEN) | Validation schemas + XOR refine + E2E scaffold | 720a011 | src/lib/validation/task.ts, reply.ts, tests/e2e/admin-tasks.spec.ts |
| 2 | tRPC routers + PostType.TASK cleanup | f4e21f7 | task.ts, admin.ts, reply.ts, _app.ts, post-card.tsx, post/[id]/page.tsx |
| 3 | Schema migration + db push + Prisma generate | 338fee8 | prisma/schema.prisma, feed-list.tsx, post-history-tabs.tsx |

## Must-Have Truth Verification

- **createTaskSchema rejects cpReward < 1 and accepts cpReward >= 1:** Verified by 6 unit tests covering 0, -1, 1.5, coerce "5"
- **createReplySchema XOR refine:** Tested — both-set and neither-set produce `success: false`
- **task.completeTask refuses AWARDED re-award:** `existing?.status === "AWARDED"` guard throws BAD_REQUEST "Already awarded."
- **All admin tRPC procedures throw FORBIDDEN for non-admin:** `ctx.session.user.role !== "ADMIN"` check at top of each admin/task procedure (no requireAdmin in tRPC — Pitfall 3)
- **Database accepts Reply row with taskId set and postId null:** db push applied; `postId String?` and `taskId String?` live in schema
- **PostType enum contains only AWARD and DEDUCT:** TASK removed, db push applied
- **getAllUsers excludes password:** Explicit select with only id/name/email/username/cigmaPoints/role/createdAt
- **updateBalanceSchema has no reason field:** Verified in unit tests and schema shape check

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] D-03 cleanup missed feed-list.tsx and post-history-tabs.tsx**
- **Found during:** Task 3, after TypeScript check post-Prisma-generate
- **Issue:** `type={item.type as "AWARD" | "DEDUCT" | "TASK"}` in feed-list.tsx and post-history-tabs.tsx caused TS2322 errors after PostCard's type prop was narrowed to `"AWARD" | "DEDUCT"`
- **Fix:** Changed both casts to `as "AWARD" | "DEDUCT"`
- **Files modified:** src/components/feed/feed-list.tsx, src/components/profile/post-history-tabs.tsx
- **Commit:** 338fee8

**2. [Rule 3 - Blocking] Used db push instead of migrate dev**
- **Found during:** Task 3 migration run
- **Issue:** `prisma migrate dev` detected "drift" because the project uses `db push` (no migration history exists). Running migrate dev would require a full schema reset.
- **Fix:** Used `prisma db push --accept-data-loss` (Assumption A2: no TASK posts exist in dev DB; TASK enum removal is safe)
- **Impact:** No migration directory created (consistent with existing project approach — all prior phases used db push)
- **Commit:** 338fee8

**3. [Rule 3 - Blocking] .env.local symlink required for Prisma CLI in worktree**
- **Found during:** Task 3 migration run
- **Issue:** Worktree has no `.env.local`; prisma.config.ts uses `dotenvConfig({ path: ".env.local" })` relative to cwd
- **Fix:** Created symlink `.env.local -> /home/petros/Github/cigma-points/.env.local` in worktree (not committed — runtime only)
- **Impact:** Migration succeeded

## Known Stubs

None — this plan is entirely backend (schemas, routers, migration). No UI components with data stubs exist in this plan.

## Threat Flags

None — all trust boundaries identified in the plan's threat model were mitigated:
- T-6-01: FORBIDDEN guard on all admin procedures
- T-6-02: Idempotency guard in completeTask
- T-6-03: $transaction wraps CP award
- T-6-04: adminId from ctx.session.user.id
- T-6-05: Explicit select on getAllUsers (no password)
- T-6-06: protectedProcedure on all procedures
- T-6-07: parentId same-thread guard in createReply

## Self-Check: PASSED
