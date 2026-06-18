---
plan: 04-02
phase: 04-voting-settlement
status: complete
completed: 2026-06-18
requirements: [VOTE-01, VOTE-02]

key-files:
  created:
    - src/components/feed/vote-buttons.tsx
    - src/components/ui/sonner.tsx
  modified:
    - src/app/layout.tsx
    - src/components/post-card.tsx
    - src/components/feed/feed-list.tsx
    - src/trpc/routers/post.ts
    - src/components/profile/post-history-tabs.tsx
---

## Summary

Built the complete vote UI layer for Phase 4. Users can now agree or disagree with
point nominations directly from the feed with instant optimistic feedback.

## What Was Delivered

**Task 1 — Sonner toast + getFeed type fix:**
- Added `<Toaster />` to root layout for toast notifications
- Fixed `getFeed` return type: removed bad `Record<string, unknown>` cast that
  erased all Prisma fields from TypeScript inference

**Task 2 — VoteButtons component (`src/components/feed/vote-buttons.tsx`):**
- Client component with agree/disagree button pair
- Active state: agree → `variant="default"`, disagree → `variant="destructive"`
- Count-only display (`text-muted-foreground`) for settled/author/closed-window cases
- `aria-pressed` on both buttons for screen reader vote state
- ThumbsUp/ThumbsDown icons (not ArrowUpCircle/ArrowDownCircle)
- Buttons disabled during in-flight mutation

**Task 3 — PostCard footer wiring (`src/components/post-card.tsx`):**
- Replaced `voteCount` stopgap with `agreeCount`, `disagreeCount`, `VoteButtons`
- Added `userVote`, `currentUserId`, `onVote`, `onRetract`, `isPending` props
- `isVotingOpen` computed inline: `!settled && new Date() < votingEndsAt && currentUserId !== author.id`
- Voting deadline row added below vote buttons for unsettled posts
- Vote buttons hidden when interaction props absent (profile/history views)

**Task 4 — FeedList mutations + optimistic updates (`src/components/feed/feed-list.tsx`):**
- `castVoteMutation`: optimistic update increments new vote type, decrements previous
  (handles vote-flip), snapshot for rollback, `toast.error` on failure, invalidate on settle
- `retractVoteMutation`: optimistic update decrements previous vote type, clears userVote
- Pattern: `queryClient.setQueriesData(trpc.post.getFeed.infiniteQueryFilter({ limit: 20 }), ...)`
- No `useUtils()` — split-context codebase uses `useTRPC()` + direct queryClient calls
- Per-post `onVote`/`onRetract` closures passed to PostCard

## Deviations

- **getFeed type fix in post router**: The original 04-01 plan used `Record<string, unknown>` cast
  to strip `votes` before spreading, which erased all TypeScript types on the result. Fixed by
  removing the cast and letting TypeScript infer from the Prisma select directly.
- **post-history-tabs.tsx**: Had legacy `voteCount` prop removed in Task 3 — patched to pass
  `agreeCount={0} disagreeCount={0}` as placeholder (profile view doesn't fetch vote counts yet).

## Self-Check: PASSED

- TypeScript: `npx tsc --noEmit` exits 0
- Unit tests: 49 passed, 0 failed
- No `useUtils` in feed-list.tsx
- `infiniteQueryFilter({ limit: 20 })` matches useInfiniteQuery input exactly
