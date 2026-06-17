---
phase: 03-posts-feed
plan: "01"
subsystem: backend-data-layer
tags: [trpc, zod, uploadthing, post-creation, feed, search]
dependency_graph:
  requires:
    - 02-04 (editProfileSchema, user tRPC router, existing session/auth patterns)
  provides:
    - createPostSchema (src/lib/validation/post.ts)
    - postRouter with createPost, getFeed, searchUsers (src/trpc/routers/post.ts)
    - post namespace wired into AppRouter (src/trpc/routers/_app.ts)
    - postMediaUploader Uploadthing route (src/app/api/uploadthing/core.ts)
  affects:
    - 03-02 (feed page — consumes trpc.post.getFeed)
    - 03-03 (create post modal — consumes trpc.post.createPost and trpc.post.searchUsers)
    - 03-04 (PostCard activation + E2E — depends on all three procedures)
tech_stack:
  added: []
  patterns:
    - cursor-based pagination (take: limit+1 / pop nextCursor — mirrors getPostHistory)
    - protectedProcedure for all three post procedures (auth gate before any DB access)
    - z.coerce.number() for HTML input[type=number] string coercion in Zod schema
    - Uploadthing multi-type route (image + video) without DB write in onUploadComplete
key_files:
  created:
    - src/lib/validation/post.ts
    - src/trpc/routers/post.ts
  modified:
    - src/trpc/routers/_app.ts
    - src/app/api/uploadthing/core.ts
decisions:
  - "createPostSchema uses z.coerce.number() for cpAmount — handles HTML input[type=number] string delivery to react-hook-form; idempotent server-side (superjson sends numbers over tRPC wire)"
  - "postMediaUploader onUploadComplete does not write to DB — URL returned to client, stored in form state, submitted with createPost mutation (post doesn't exist at upload time)"
  - "getFeed includes explanation field in select — zero-cost, avoids a future schema change when PostCard adds preview text"
  - "Prisma generated client copied to worktree (prisma/generated/prisma) to enable tsc --noEmit verification — pre-existing absence in worktree was a Rule 3 blocking fix"
metrics:
  duration: "~3 minutes"
  completed_date: "2026-06-17"
  tasks: 4
  files: 4
---

# Phase 03 Plan 01: Backend Data Layer Summary

**One-liner:** tRPC post router (createPost/getFeed/searchUsers) with Zod schema and Uploadthing postMediaUploader route, forming the complete backend contract for Phase 3 UI slices.

## What Was Built

This plan establishes the complete backend data layer for Phase 3 post creation and feed. Four files were created or modified:

1. **`src/lib/validation/post.ts`** — `createPostSchema` exported as a shared Zod object. Six fields: `type` (AWARD/DEDUCT enum), `targetUserId`, `title`, `explanation`, `cpAmount` (z.coerce.number for HTML string coercion), `mediaUrl` (optional URL). Server-only fields (`settled`, `outcome`, `votingEndsAt`, `authorId`) are deliberately excluded.

2. **`src/trpc/routers/post.ts`** — `postRouter` with three `protectedProcedure` endpoints:
   - `createPost`: authorId from session, self-nomination BAD_REQUEST guard, target user verified (must exist + have username), votingEndsAt set server-side (+24h), explicit `select: { id, createdAt }` on output.
   - `getFeed`: cursor-based pagination (take: limit+1 / pop nextCursor), AWARD+DEDUCT filter, includes `explanation`, `username`, and `_count.replies` for Phase 3 UI.
   - `searchUsers`: excludes calling user, only username-claimed users, case-insensitive LIKE on username+name, capped at 8 results.

3. **`src/trpc/routers/_app.ts`** — `postRouter` imported and added to `createTRPCRouter` alongside `userRouter`. `AppRouter` type now exposes `trpc.post.*` namespace to all client callers.

4. **`src/app/api/uploadthing/core.ts`** — `postMediaUploader` added alongside `avatarUploader`. Image (8MB) + video (64MB) with identical `auth()` middleware gate. `onUploadComplete` returns `{ url }` only — no DB write (the post doesn't exist yet; URL is passed through form state to `createPost`).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | createPostSchema — shared Zod validation schema | 3f55cb3 | src/lib/validation/post.ts |
| 2 | postRouter — createPost, getFeed, searchUsers | 318fc90 | src/trpc/routers/post.ts |
| 3 | Wire postRouter into _app.ts | eac347a | src/trpc/routers/_app.ts |
| 4 | Add postMediaUploader to Uploadthing core.ts | 86f28c9 | src/app/api/uploadthing/core.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prisma generated client absent from worktree**
- **Found during:** Task 1 verification (tsc --noEmit)
- **Issue:** The worktree's `prisma/` directory contained only `schema.prisma` and `seed.ts`. The Prisma v7 generated client (`prisma/generated/prisma/`) was missing, causing `tsc --noEmit` to fail with `Cannot find module '../../prisma/generated/prisma/client'` errors in `src/lib/db.ts` and `src/trpc/routers/user.ts`.
- **Fix:** Copied generated client from main repo (`/home/petros/Github/cigma-points/prisma/generated/`) to the worktree. This is a worktree isolation artifact — the generated output exists in the main repo but git worktrees only contain tracked source files, not generated artifacts.
- **Files modified:** `prisma/generated/prisma/` (copied, not committed — generated artifacts are not tracked)
- **Commit:** n/a (generated files, not committed)

## Threat Model Compliance

All mitigations in the plan's `<threat_model>` are implemented:

| Threat | Mitigation | Status |
|--------|-----------|--------|
| Unauthorized post creation | All three procedures are `protectedProcedure` | Implemented |
| Self-nomination bypass | `if (input.targetUserId === authorId)` → BAD_REQUEST | Implemented |
| Mass-assignment (settled/outcome/votingEndsAt) | Excluded from createPostSchema | Implemented |
| Negative/zero cpAmount | `z.coerce.number().int().min(1)` | Implemented |
| Targeting non-existent/username-less users | `db.user.findUnique` + username null check | Implemented |
| Unauthenticated media upload | `postMediaUploader.middleware()` calls `auth()` | Implemented |
| votingEndsAt client-supplied | votingEndsAt absent from createPostSchema | Implemented |

## Known Stubs

None — this plan creates pure backend contracts. No UI rendering, no data display components.

## Threat Flags

No new security-relevant surface beyond what was specified in the plan's threat model.

## Self-Check: PASSED

- [x] `src/lib/validation/post.ts` exists: VERIFIED
- [x] `src/trpc/routers/post.ts` exists: VERIFIED
- [x] `src/trpc/routers/_app.ts` modified with post: postRouter: VERIFIED
- [x] `src/app/api/uploadthing/core.ts` modified with postMediaUploader: VERIFIED
- [x] Commit 3f55cb3 exists: VERIFIED (git log)
- [x] Commit 318fc90 exists: VERIFIED (git log)
- [x] Commit eac347a exists: VERIFIED (git log)
- [x] Commit 86f28c9 exists: VERIFIED (git log)
- [x] `npx tsc --noEmit` exits 0: VERIFIED
