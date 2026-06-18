---
phase: 04-voting-settlement
plan: "03"
subsystem: settlement-engine
tags: [settlement, cron, pure-function, prisma-transaction, unit-tests]
dependency_graph:
  requires:
    - prisma/schema.prisma (Post, Vote, User models)
    - src/lib/db.ts (db singleton)
  provides:
    - src/lib/settlement.ts (settlePost pure function)
    - src/app/api/cron/settle/route.ts (GET settlement cron endpoint)
    - tests/unit/settlement.test.ts (7 unit tests)
  affects:
    - 04-04-PLAN.md (E2E tests will exercise the settled-post display state)
tech_stack:
  added: []
  patterns:
    - Pure function returning Prisma op array — caller passes to db.$transaction([])
    - Array-form $transaction (PrismaNeon HTTP adapter constraint)
    - cron-job.org external scheduler (Vercel Hobby daily-cron constraint)
    - Bearer token auth for cron endpoint (CRON_SECRET env var)
key_files:
  created:
    - src/lib/settlement.ts
    - src/app/api/cron/settle/route.ts
    - tests/unit/settlement.test.ts
  modified: []
decisions:
  - settlePost returns Prisma op array (not a Promise) — callee builds ops, caller batches with $transaction
  - Type cast in route.ts flatMap needed because Prisma returns PostType enum; WHERE filter guarantees AWARD/DEDUCT only
  - cron-job.org used over vercel.json crons — Vercel Hobby plan only supports one daily cron, external scheduler gives 15-min cadence
metrics:
  duration: "3m"
  completed: "2026-06-18"
  tasks_completed: 2
  files_created: 3
  files_modified: 0
---

# Phase 4 Plan 3: Settlement Engine Summary

**One-liner:** Pure settlePost function with 7 vitest unit tests + CRON_SECRET-protected GET route that batch-settles expired AWARD/DEDUCT posts using array-form db.$transaction.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | settlePost pure function + unit tests | 7e78e65 | src/lib/settlement.ts, tests/unit/settlement.test.ts |
| 2 | /api/cron/settle GET route | 318f589 | src/app/api/cron/settle/route.ts |

## What Was Built

**Task 1 — settlePost (src/lib/settlement.ts):**
- Pure function: takes an `ExpiredPost` snapshot (id, type, cpAmount, targetUserId, votes), returns Prisma op array
- Settlement rules implemented per D-01/D-02/D-04:
  - `outcome = agreeCount > disagreeCount ? "Awarded" : "Rejected"` (D-01: tie/zero-vote → Rejected)
  - Awarded AWARD → `cigmaPoints: { increment: cpAmount }` (D-02)
  - Awarded DEDUCT → `cigmaPoints: { decrement: cpAmount }` (D-02)
  - Rejected → no balance op, 1-element ops array (post.update only)
- No DB calls — caller passes returned ops to `db.$transaction([])`

**tests/unit/settlement.test.ts — 7 test cases, all passing:**
1. agrees > disagrees → Awarded, 2 ops (post + balance)
2. tie (agrees === disagrees) → Rejected, 1 op
3. zero votes → Rejected, 1 op
4. disagrees > agrees → Rejected, 1 op
5. AWARD Awarded → cigmaPoints.increment
6. DEDUCT Awarded → cigmaPoints.decrement
7. Rejected → ops.length 1, no balance op

**Task 2 — /api/cron/settle GET route (src/app/api/cron/settle/route.ts):**
- Authorization: Bearer ${CRON_SECRET} check before any DB access; returns 401 if absent/wrong
- Queries only `settled: false, type: { in: ["AWARD", "DEDUCT"] }, votingEndsAt: { lte: now }`
- TASK posts excluded by WHERE filter
- Builds ops via `expiredPosts.flatMap(post => settlePost(post))`
- Executes `db.$transaction(ops)` — array-form for PrismaNeon HTTP adapter compatibility (D-03)
- Returns `{ settled: N }` JSON
- Cron scheduling documented in top comment: cron-job.org external scheduler (Vercel Hobby daily-only constraint)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript parameter type error in route.ts flatMap**
- **Found during:** Task 2 — tsc check
- **Issue:** Prisma `findMany` returns `PostType` (AWARD | DEDUCT | TASK), but `settlePost` parameter expects `type: "AWARD" | "DEDUCT"`. TypeScript complained about implicit `any` in the flatMap callback because the Prisma generated client produces `never` in the worktree isolation context (no symlink to generated Prisma types).
- **Fix:** Added type cast `post as typeof post & { type: "AWARD" | "DEDUCT" }` in the flatMap — WHERE filter guarantees only AWARD/DEDUCT posts are returned.
- **Files modified:** src/app/api/cron/settle/route.ts
- **Commit:** 318f589 (included in task commit)

## Threat Surface Scan

All threat model mitigations from the plan are implemented:
- CRON_SECRET auth: `if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) return 401`
- Double-settlement prevented: `settled: false` filter + atomic `db.$transaction`
- TASK post exclusion: `type: { in: ["AWARD", "DEDUCT"] }` WHERE clause
- $transaction atomicity: array-form batch ensures no partial balance updates

No new security surface introduced beyond what the plan specified.

## Known Stubs

None — the settlement function is fully wired. No placeholder values.

## Self-Check: PASSED

- [x] src/lib/settlement.ts exists and exports `settlePost`
- [x] tests/unit/settlement.test.ts — 7 tests passing (`npm run test:unit -- --run tests/unit/settlement.test.ts`)
- [x] src/app/api/cron/settle/route.ts exists and exports `GET`
- [x] Commit 7e78e65 verified: `feat(04-03): settlePost pure function + 7 unit tests`
- [x] Commit 318f589 verified: `feat(04-03): /api/cron/settle GET route — CRON_SECRET auth + batch settlement`
- [x] No TS errors in settlement or cron files (verified from main repo tsc run)
