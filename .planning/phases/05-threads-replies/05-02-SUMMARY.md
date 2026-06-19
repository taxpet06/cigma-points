---
phase: 05-threads-replies
plan: "02"
subsystem: ui-layer
tags: [nextjs, react, trpc, tanstack-query, uploadthing, shadcn]
dependency_graph:
  requires:
    - replyRouter.createReply (src/trpc/routers/reply.ts — Plan 05-01)
    - replyRouter.getReplies (src/trpc/routers/reply.ts — Plan 05-01)
    - reply:replyRouter registration (src/trpc/routers/_app.ts — Plan 05-01)
  provides:
    - ReplyCard (src/components/thread/reply-card.tsx)
    - ReplyThread (src/components/thread/reply-thread.tsx)
    - ReplyCompose (src/components/thread/reply-compose.tsx)
    - ThreadSection (src/components/thread/thread-section.tsx)
    - PostDetailPage route (src/app/post/[id]/page.tsx)
    - replyCount link activation (src/components/post-card.tsx)
  affects:
    - src/components/post-card.tsx (replyCount now renders as <Link> to /post/${id})
    - src/app/post/[id]/ (new App Router route)
tech_stack:
  added: []
  patterns:
    - Recursive client component with depth-cap (MAX_VISUAL_DEPTH=4) — ReplyCard
    - Client-side tree builder (buildTree) from flat oldest-first array — ReplyThread
    - Lifted state pattern for cross-component state (parentId/replyingToUsername) — ThreadSection
    - Server component + client boundary separation (page.tsx + thread-section.tsx)
    - Non-optimistic mutation with dual cache invalidation (reply + feed) — ReplyCompose
    - scrollIntoView + setTimeout focus for iOS Safari compatibility — ThreadSection
    - Next.js 15 async params (await params) — PostDetailPage
key_files:
  created:
    - src/components/thread/reply-card.tsx
    - src/components/thread/reply-thread.tsx
    - src/components/thread/reply-compose.tsx
    - src/components/thread/thread-section.tsx
    - src/app/post/[id]/page.tsx
    - src/components/ui/sonner.tsx
  modified:
    - src/components/post-card.tsx
    - .gitignore
decisions:
  - "ThreadSection as separate file (src/components/thread/thread-section.tsx) to keep page.tsx a clean server component (App Router boundary)"
  - "ReplyNode type exported from reply-thread.tsx; ReplyCard uses import type — single source of truth, no circular dependency"
  - "Prisma generated client symlinked in worktree + added to .gitignore to enable build verification without committing generated files"
metrics:
  duration: "~8 minutes"
  completed: "2026-06-19"
  tasks_completed: 3
  files_created: 6
  files_modified: 2
---

# Phase 5 Plan 02: Thread UI — Detail Page + Reply Components Summary

**One-liner:** Full thread vertical slice on `/post/[id]`: async server component detail page (explicit Prisma select, notFound guard) + ReplyCompose (non-optimistic, dismissible banner, media reuse) + ReplyThread (buildTree + recursive ReplyCard with 4-level indent cap) + ThreadSection (lifted parentId state, scroll+focus on Reply click) + PostCard replyCount activated as `<Link>` to `/post/${id}`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | ReplyCard (recursive, depth-capped) + ReplyThread (query + buildTree) | 7d41b32 | src/components/thread/reply-card.tsx, src/components/thread/reply-thread.tsx |
| 2 | ReplyCompose (pinned box, banner, media, non-optimistic submit) | d01d447 | src/components/thread/reply-compose.tsx, src/components/ui/sonner.tsx |
| 3 | /post/[id] detail page wiring compose + thread + shared reply state | bc3330f | src/app/post/[id]/page.tsx, src/components/thread/thread-section.tsx, src/components/post-card.tsx, .gitignore |

## Verification Results

- `npx tsc --noEmit` (new files): 0 errors in thread/* and post/[id]/page.tsx (pre-existing errors in other files excluded per scope boundary)
- `npm run lint` (new files): 0 errors, 0 warnings in all new files
- `npm run build` from worktree: Build succeeded; `/post/[id]` appears as `f (Dynamic)` route in output
- All acceptance criteria pass across all 3 tasks

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing sonner.tsx in worktree**
- **Found during:** Task 2
- **Issue:** `src/components/ui/sonner.tsx` was untracked in the main repo (listed in git status as `?? src/components/ui/sonner.tsx`) but absent from the worktree. `layout.tsx` imports it, causing a TypeScript module error that would block the build.
- **Fix:** Copied `sonner.tsx` from main repo to worktree and committed it as part of Task 2.
- **Files modified:** `src/components/ui/sonner.tsx`
- **Commit:** d01d447

**2. [Rule 3 - Blocking] Prisma generated client not in worktree (build verification)**
- **Found during:** Task 3 build verification
- **Issue:** `npm run build` from the worktree failed because `prisma/generated/` exists in the main repo but not in the worktree. The relative import in `src/lib/db.ts` resolved to a missing directory in the worktree context.
- **Fix:** Created a symlink `prisma/generated -> main repo's prisma/generated` in the worktree (read-only; no files changed in generated). Added `prisma/generated` (without trailing slash) to `.gitignore` to prevent the symlink from being staged.
- **Files modified:** `.gitignore`
- **Commit:** bc3330f

**3. [Rule 1 - Bug] ReplyThread TypeScript type inference cascade**
- **Found during:** Task 1 typecheck
- **Issue:** `tsc --noEmit` reported type error for `buildTree(replies)`: argument was typed as `() => never` due to the pre-existing Prisma client type resolution failure cascading into tRPC inference.
- **Fix:** Added explicit cast `const replies = repliesData as Omit<ReplyNode, "children">[] | undefined` after the `useQuery` call. TypeScript error resolved.
- **Files modified:** `src/components/thread/reply-thread.tsx`
- **Commit:** 7d41b32

## Known Stubs

None. All data flows are wired to real tRPC queries (getReplies) and mutations (createReply). The textarea `placeholder="Write a reply…"` is intentional UI copy per the Copywriting Contract, not a stub.

## Threat Surface Scan

All planned mitigations were implemented:

| Threat ID | Mitigation Applied | File |
|-----------|-------------------|------|
| T-05-06 | Explicit Prisma select on db.post.findUnique — no password/email; author/targetUser limited to { id, name, image } | src/app/post/[id]/page.tsx |
| T-05-07 | Unknown id → notFound(); Prisma parameterizes where:{id} lookup | src/app/post/[id]/page.tsx |
| T-05-08 | React escapes text content; no dangerouslySetInnerHTML in reply-card.tsx | src/components/thread/reply-card.tsx |
| T-05-09 | Orphaned media on failed submit accepted at MVP scale (same posture as post media) | src/components/thread/reply-compose.tsx |
| T-05-10 | createReply mutation uses protectedProcedure with authorId from session (enforced in Plan 05-01) | src/components/thread/reply-compose.tsx |

No new security surface introduced beyond what was planned.

## Self-Check: PASSED

Files created/modified:
- src/components/thread/reply-card.tsx: FOUND
- src/components/thread/reply-thread.tsx: FOUND
- src/components/thread/reply-compose.tsx: FOUND
- src/components/thread/thread-section.tsx: FOUND
- src/app/post/[id]/page.tsx: FOUND
- src/components/ui/sonner.tsx: FOUND
- src/components/post-card.tsx (modified): FOUND
- .gitignore (modified): FOUND

Commits:
- 7d41b32 (Task 1): FOUND
- d01d447 (Task 2): FOUND
- bc3330f (Task 3): FOUND
