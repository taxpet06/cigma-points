---
phase: 04-voting-settlement
plan: 01
subsystem: api
tags: [trpc, prisma, zod, voting, feed]

# Dependency graph
requires:
  - phase: 03-posts-feed
    provides: postRouter with createPost, getFeed, searchUsers; Post schema with votingEndsAt field

provides:
  - castVoteSchema, retractVoteSchema Zod schemas in src/lib/validation/vote.ts
  - deriveVoteState pure helper converting userVote row to "agree" | "disagree" | "none"
  - castVote tRPC mutation with upsert, self-vote guard, voting window enforcement
  - retractVote tRPC mutation with deleteMany, voting window enforcement
  - getFeed extended with agreeCount, disagreeCount, userVote (raw votes array stripped)
  - Wave 0 test stubs (vote-router.test.ts todos, vote-state.test.ts GREEN, E2E skips)

affects: [04-02, 04-03, 04-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Upsert on compound unique (postId_userId) for idempotent vote flipping"
    - "JS-side vote count computation from raw votes array rather than filtered _count"
    - "Strip raw votes array before returning from getFeed — expose only agreeCount, disagreeCount, userVote"
    - "deleteMany for retract (graceful no-op if vote row absent)"

key-files:
  created:
    - src/lib/validation/vote.ts
    - tests/unit/vote-router.test.ts
    - tests/unit/vote-state.test.ts
    - tests/e2e/voting.spec.ts
    - tests/e2e/settlement-outcome.spec.ts
  modified:
    - src/trpc/routers/post.ts

key-decisions:
  - "Upsert on @@unique([postId, userId]) for castVote — a second call flips VoteType, not inserts a duplicate"
  - "deleteMany not delete for retractVote — silently no-ops if vote row absent, preventing 500s"
  - "JS-side agreeCount/disagreeCount computation from votes array rather than Prisma filtered _count — aligns with D-CONTEXT-10"
  - "userVote returned as { type } | null per caller's own vote row — raw votes list never exposed"
  - "test.skip with async body instead of test.todo for Playwright E2E stubs (Playwright types lack test.todo)"

patterns-established:
  - "Vote procedures (castVote, retractVote) both check post existence, settled flag, and votingEndsAt window — consistent double guard"
  - "callerId from ctx.session.user.id — never from client input, even in getFeed for userVote lookup"

requirements-completed: [VOTE-01, VOTE-02]

# Metrics
duration: 6min
completed: 2026-06-18
---

# Phase 04 Plan 01: Vote Backend + Wave 0 Test Stubs Summary

**tRPC castVote/retractVote mutations with Prisma upsert/deleteMany, getFeed extended with JS-computed agreeCount/disagreeCount/userVote, and Wave 0 RED/todo test scaffolding**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-06-18T00:06:48Z
- **Completed:** 2026-06-18T00:12:00Z
- **Tasks:** 4
- **Files modified:** 6

## Accomplishments

- Wave 0 test stubs: vote-state.test.ts RED (import not found), vote-router.test.ts 9 todos, E2E specs with test.skip placeholders
- `src/lib/validation/vote.ts` with castVoteSchema, retractVoteSchema, deriveVoteState helper — vote-state unit tests GREEN (3/3)
- castVote mutation: upsert on postId_userId compound unique, self-vote FORBIDDEN guard, voting window check (settled || votingEndsAt passed)
- retractVote mutation: deleteMany (no-op if absent), voting window check matches castVote
- getFeed extended: raw votes select then JS-side agreeCount, disagreeCount, userVote — raw list stripped before return

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 test stubs** - `bc19746` (test)
2. **Task 2: castVoteSchema, retractVoteSchema, deriveVoteState** - `f6ddbfd` (feat)
3. **Task 3: castVote and retractVote mutations** - `b87b511` (feat)
4. **Task 4: extend getFeed with vote counts** - `fbc0102` (feat)

## Files Created/Modified

- `src/lib/validation/vote.ts` — castVoteSchema (postId + AGREE|DISAGREE enum), retractVoteSchema (postId only), deriveVoteState pure helper
- `src/trpc/routers/post.ts` — castVote mutation, retractVote mutation, getFeed extended with agreeCount/disagreeCount/userVote
- `tests/unit/vote-router.test.ts` — 9 test.todo stubs for castVote/retractVote (filled in later)
- `tests/unit/vote-state.test.ts` — 3 unit tests for deriveVoteState (GREEN after Task 2)
- `tests/e2e/voting.spec.ts` — 5 VOTE-01 E2E stubs (test.skip, filled in 04-04)
- `tests/e2e/settlement-outcome.spec.ts` — 3 VOTE-04 E2E stubs (test.skip, filled in 04-04)

## Decisions Made

- Upsert on @@unique([postId, userId]) for castVote — idempotent; second call flips VoteType
- deleteMany for retractVote — silently no-ops when vote row absent, avoids 500 on double-retract
- JS-side agreeCount/disagreeCount computation (votes.filter) rather than Prisma filtered _count — follows D-10 from 04-CONTEXT.md
- userVote field is `{ type } | null` — caller's own row only; raw voter list never leaves the server
- Playwright E2E stubs use test.skip with async body (not test.todo) — Playwright's TypeScript types lack test.todo

## Deviations from Plan

**1. [Rule 1 - Bug] Replaced test.todo with test.skip in E2E stubs**
- **Found during:** Task 1 (Wave 0 test stubs)
- **Issue:** Plan specified `test.todo()` for Playwright E2E stubs, but Playwright's TypeScript types do not expose `test.todo` — causes TS2339 errors
- **Fix:** Used `test.skip("description", async () => {})` with eslint-disable comment, matching the pattern already established in posts-feed.spec.ts
- **Files modified:** tests/e2e/voting.spec.ts, tests/e2e/settlement-outcome.spec.ts
- **Verification:** tsc --noEmit exits 0 on those files; E2E stubs are syntactically valid Playwright tests
- **Committed in:** f6ddbfd (Task 2 commit — E2E files restaged)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Minimal — stub behavior is identical (tests skipped at runtime); change was required for TypeScript compatibility with existing Playwright version.

## Issues Encountered

- The worktree does not have the Prisma generated client (`prisma/generated/prisma/client`), so `tsc --noEmit` produced `implicit any` errors on the new `map` callback. Fixed by adding an explicit `VoteRow` type alias and casting `items` to the typed array before mapping. This is a pre-existing worktree infrastructure limitation, not a bug in the code.

## Known Stubs

None — all exported symbols are fully implemented.

## Next Phase Readiness

- 04-02 (VoteButtons UI): castVote and retractVote tRPC procedures are live; getFeed now returns agreeCount, disagreeCount, userVote fields needed for PostCard wiring
- 04-03 (Cron settlement): postRouter is ready; settlement engine writes to Post.settled/outcome (already in schema)
- 04-04 (E2E): vote-router.test.ts todos and E2E test.skip stubs are scaffolded and waiting to be filled

---
*Phase: 04-voting-settlement*
*Completed: 2026-06-18*
