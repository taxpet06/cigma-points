---
phase: 05-threads-replies
plan: "01"
subsystem: data-layer
tags: [trpc, zod, validation, e2e, tdd]
dependency_graph:
  requires: []
  provides:
    - createReplySchema (src/lib/validation/reply.ts)
    - replyRouter.createReply (src/trpc/routers/reply.ts)
    - replyRouter.getReplies (src/trpc/routers/reply.ts)
    - reply:replyRouter registration (src/trpc/routers/_app.ts)
    - threads E2E scaffold (tests/e2e/threads.spec.ts)
  affects:
    - src/trpc/routers/_app.ts (AppRouter type now includes reply namespace)
tech_stack:
  added: []
  patterns:
    - TDD RED/GREEN for schema validation (vitest)
    - protectedProcedure for both reply router procedures
    - authorId from session (anti-spoofing, never from client input)
    - NOT_FOUND postId guard before db.reply.create
    - Explicit Prisma select (information disclosure prevention)
    - Flat oldest-first getReplies (client builds tree from parentId)
    - Serial mode E2E spec with THRD-01/03 active (failing pre-UI) and THRD-02 skipped
key_files:
  created:
    - src/lib/validation/reply.ts
    - src/trpc/routers/reply.ts
    - tests/unit/reply-schema.test.ts
    - tests/e2e/threads.spec.ts
  modified:
    - src/trpc/routers/_app.ts
decisions:
  - "authorId always from ctx.session.user.id — excluded from createReplySchema shape (T-05-01, T-05-05)"
  - "getReplies returns flat array (oldest-first); client builds visual tree from parentId references (D-07)"
  - "Both createReply and getReplies use protectedProcedure — UNAUTHORIZED before any DB access (T-05-02)"
  - "NOT_FOUND guard on postId verifies post existence before reply.create (T-05-03)"
  - "Explicit Prisma select on getReplies: author limited to {id, name, image, username} — never returns email (T-05-04)"
  - "E2E THRD-01 and THRD-03 are intentionally failing pre-UI (Wave 0 RED gate); THRD-02 skipped (Uploadthing CI constraint)"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-19"
  tasks_completed: 3
  files_created: 4
  files_modified: 1
---

# Phase 5 Plan 01: Data Layer + Test Scaffolds Summary

**One-liner:** `createReplySchema` (zod, authorId excluded) + `replyRouter` (protectedProcedure, authorId from session, NOT_FOUND guard, flat oldest-first getReplies) registered on root tRPC router + unit tests (8 pass, TDD) + failing E2E thread spec scaffold (THRD-01/THRD-03 active, THRD-02 skipped).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | createReplySchema + unit tests | 29fb25f | src/lib/validation/reply.ts, tests/unit/reply-schema.test.ts |
| 2 | replyRouter + register in _app.ts | 6addfa3 | src/trpc/routers/reply.ts, src/trpc/routers/_app.ts |
| 3 | Failing E2E spec scaffold | cb56ab4 | tests/e2e/threads.spec.ts |

## Verification Results

- `npm run test:unit -- tests/unit/reply-schema.test.ts`: 8/8 tests pass
- `npx tsc --noEmit` (new files only): 0 errors in reply.ts, _app.ts (pre-existing errors in other files excluded per scope boundary)
- `npm run lint` (new files): 0 errors, 0 warnings in new files
- `npx playwright test tests/e2e/threads.spec.ts --list`: 6 tests collected (3 setup, THRD-01, THRD-03 active, THRD-02 skipped)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. This plan is data-layer only (schema + router + test scaffolds). No UI components with stub data were created.

## Threat Surface Scan

All security mitigations from the threat register were implemented:

| Threat ID | Mitigation Applied |
|-----------|-------------------|
| T-05-01 | `authorId = ctx.session.user.id` — `createReplySchema` excludes `authorId` from shape |
| T-05-02 | Both `createReply` and `getReplies` use `protectedProcedure` |
| T-05-03 | `db.post.findUnique({ where: { id: input.postId } })` guard before `db.reply.create` |
| T-05-04 | Explicit select: `author: { select: { id, name, image, username } }` — no email returned |
| T-05-05 | `createReplySchema.shape` does not contain `authorId` (unit test asserts this) |

No new security surface introduced beyond what was planned.

## Self-Check: PASSED

Files exist:
- src/lib/validation/reply.ts: FOUND
- src/trpc/routers/reply.ts: FOUND
- tests/unit/reply-schema.test.ts: FOUND
- tests/e2e/threads.spec.ts: FOUND
- src/trpc/routers/_app.ts (modified): FOUND

Commits exist:
- 29fb25f (Task 1): FOUND
- 6addfa3 (Task 2): FOUND
- cb56ab4 (Task 3): FOUND
