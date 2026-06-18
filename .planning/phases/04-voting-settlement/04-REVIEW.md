---
phase: 04-voting-settlement
reviewed: 2026-06-17T00:00:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - src/app/api/cron/settle/route.ts
  - src/app/api/test/seed-post/route.ts
  - src/app/layout.tsx
  - src/components/feed/feed-list.tsx
  - src/components/feed/vote-buttons.tsx
  - src/components/post-card.tsx
  - src/components/profile/post-history-tabs.tsx
  - src/components/ui/sonner.tsx
  - src/lib/settlement.ts
  - src/lib/validation/vote.ts
  - src/trpc/routers/post.ts
  - tests/e2e/settlement-outcome.spec.ts
  - tests/e2e/voting.spec.ts
  - tests/unit/settlement.test.ts
  - tests/unit/vote-router.test.ts
  - tests/unit/vote-state.test.ts
findings:
  critical: 3
  warning: 5
  info: 3
  total: 11
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-06-17T00:00:00Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Reviewed the voting and settlement implementation for phase 04. The core settlement logic (`settlePost`) is clean and well-tested. The tRPC vote procedures have solid security posture: userId always sourced from session, self-vote blocked, voting window enforced server-side. The cron authorization guard is correct.

Three blockers were found: (1) the DEDUCT settlement path applies `decrement` by a _positive_ `cpAmount`, meaning an AWARD of +5 CP and a DEDUCT of +5 CP both move the balance in opposite directions correctly on the surface, but a DEDUCT post created with `cpAmount: -3` (as the seed endpoint does) will call `decrement(-3)` which is a Prisma increment — the sign convention is contradictory and the seed/settlement paths disagree; (2) the test seed endpoint does not check authentication at all, any unauthenticated caller can write arbitrary posts to the DB in non-production environments including staging; (3) the optimistic-update path in `feed-list.tsx` does not handle the "vote flip" case when the mutation actually lands — it sets `userVote` to the new type immediately but if `onSettled` fires an invalidation and the server returns a different state (e.g. the flip was rejected), the snapshot rollback in `onError` correctly fires, but the optimistic update diverges from server truth during the flight window because the flip subtracts `prevVote` counts and adds new counts without checking whether the mutation result confirmed the flip.

Five warnings cover: missing CRON_SECRET presence guard at startup (not just request time), `cpAmount` sign convention not enforced in Zod validation, `retractVote` not checking `post.settled` authoritatively at time-of-delete, settled post outcome badge rendering silently falls through to "Rejected" for any non-"Awarded" outcome string including null on an unsettled-but-expired post, and the `void fetchNextPage()` pattern swallowing errors silently.

---

## Critical Issues

### CR-01: DEDUCT settlement sign mismatch — negative `cpAmount` causes `decrement(-N)` which Prisma interprets as increment

**File:** `src/lib/settlement.ts:43` and `src/app/api/test/seed-post/route.ts:25`

**Issue:** In `settlePost`, when a DEDUCT post is Awarded the code calls `{ decrement: post.cpAmount }`. The `cpAmount` for a DEDUCT post is stored as a **negative** integer in the seed endpoint (`cpAmount: outcome === "Awarded" ? 5 : -3`). Prisma's `decrement` with a negative value is equivalent to an increment — it adds `abs(cpAmount)` to the balance rather than subtracting it. Even if `cpAmount` is stored as positive in real posts, the seed route and the settlement function use contradictory sign conventions with no enforcement at the schema level.

The `createPostSchema` validates `cpAmount` with `z.coerce.number().int().min(1)` — so real posts always store a _positive_ integer. The settlement correctly calls `decrement(cpAmount)` where `cpAmount` is positive. The seed endpoint however explicitly stores `cpAmount: -3` for deductions, so any E2E test that exercises the settlement path via seeded data would corrupt balances.

**Fix:**
```typescript
// In seed-post/route.ts — always store a positive cpAmount:
cpAmount: 5,  // always positive; direction is conveyed by `type: "AWARD" | "DEDUCT"`

// In settlement.ts the logic is then correct as-is:
data: {
  cigmaPoints:
    post.type === "AWARD"
      ? { increment: post.cpAmount }   // post.cpAmount > 0 always
      : { decrement: post.cpAmount },  // post.cpAmount > 0 always
},
```

Additionally, add a DB-level or Zod-level assertion that `cpAmount > 0` is invariant for all post types, so future code cannot accidentally store negative values.

---

### CR-02: Test seed endpoint has no authentication — writable by any unauthenticated caller on staging/preview

**File:** `src/app/api/test/seed-post/route.ts:5-6`

**Issue:** The only guard is `process.env.NODE_ENV === "production"`. On Vercel preview deployments and staging environments, `NODE_ENV` is `"production"` by convention (Next.js sets it at build time), so the guard may or may not fire depending on deployment config. More critically, **there is no secret / session check at all** — any HTTP client that can reach the endpoint can insert arbitrary posts into the database. If a preview branch is deployed and `NODE_ENV !== "production"` (e.g. a local CI environment pointed at a shared DB, or a misconfigured staging deployment), the endpoint is fully open.

**Fix:**
```typescript
// Add a dedicated seed secret check, independent of NODE_ENV:
export async function POST(req: Request) {
  const seedSecret = process.env.SEED_SECRET
  const authHeader = req.headers.get("authorization")
  const provided = authHeader?.replace("Bearer ", "")

  if (!seedSecret || provided !== seedSecret) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  // ... rest of handler
}
```

Set `SEED_SECRET` only in CI/test environments. Remove this endpoint from any deployment that touches production data.

---

### CR-03: Optimistic update for vote-flip produces incorrect intermediate counts when `castVote` is called while a prior vote of the opposite type exists

**File:** `src/components/feed/feed-list.tsx:34-65`

**Issue:** The `onMutate` handler for `castVoteMutation` reads `prevVote` from `item.userVote?.type` and adjusts counts optimistically. This is correct for the "no prior vote" case and the "retract and recast same type" case. However, when the user currently has a DISAGREE vote and clicks AGREE (a flip), the optimistic update sets `userVote: { type: "AGREE", userId: currentUserId ?? "" }` immediately. If the mutation **fails**, `onError` reverts correctly via the snapshot. But there is a window where:

1. The user already has a DISAGREE vote (`prevVote === "DISAGREE"`).
2. The user clicks AGREE.
3. Optimistic update: `agreeCount+1`, `disagreeCount-1`, `userVote.type = "AGREE"`.
4. The server processes the flip as an upsert — correct.
5. `onSettled` fires `invalidateQueries`, which refetches.

The bug is subtle: `currentUserId ?? ""` is used as the `userId` in the optimistic `userVote` object. If `currentUserId` is `undefined` (session not yet loaded or session expires mid-interaction), the optimistic vote is stored with `userId: ""`. When the query is later invalidated and refetched, the server returns the real vote with the real userId. This means the feed can briefly show a zero-userId vote object. More seriously, if another optimistic update fires before invalidation completes, the second `prevVote` read from the stale optimistic data will see `userId: ""` and may miscalculate counts.

**Fix:**
```typescript
// Guard castVote if session is not yet available:
onVote={(type) => {
  if (!currentUserId) return  // do not fire mutation without session
  castVoteMutation.mutate({ postId: item.id, type })
}}

// In onMutate, assert currentUserId is defined before building optimistic state:
if (!currentUserId) return  // skip optimistic update if no session
```

---

## Warnings

### WR-01: `CRON_SECRET` absence is not validated at startup — misconfigured deployment silently serves 401 forever

**File:** `src/app/api/cron/settle/route.ts:12`

**Issue:** The guard `if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET)` means that if `CRON_SECRET` is not set in the environment, the cron route will always return 401. No error is logged, no alert is raised. The settlement job silently stops working and no posts are ever settled. This is an operational blind spot.

**Fix:**
```typescript
// Log a startup warning (server-side only) when CRON_SECRET is absent:
if (!process.env.CRON_SECRET) {
  console.error("[cron/settle] CRON_SECRET environment variable is not set — cron route will reject all requests")
}
```

Alternatively, add `CRON_SECRET` to environment validation at app startup.

---

### WR-02: `cpAmount` sign convention for DEDUCT posts not enforced in schema — settlement assumes positive, no invariant documented

**File:** `src/lib/validation/post.ts:27-31`

**Issue:** The Zod schema enforces `cpAmount >= 1` (positive integer). Settlement uses `decrement: post.cpAmount` assuming positive. But this invariant is not enforced at the DB level and is not documented on the `ExpiredPost` type in `settlement.ts`. If any code path bypasses the Zod schema (admin panel, direct DB writes, future API additions), a negative `cpAmount` on a DEDUCT post would silently add points rather than remove them.

**Fix:** Add a comment/assertion to `settlement.ts` making the invariant explicit:
```typescript
// Invariant: cpAmount is always a positive integer (enforced by createPostSchema min(1)).
// decrement(cpAmount) for DEDUCT correctly subtracts; no sign flip needed.
console.assert(post.cpAmount > 0, `settlePost: cpAmount must be positive, got ${post.cpAmount}`)
```

---

### WR-03: `PostCard` outcome badge falls through to "Rejected" when `outcome === null` on a settled post — wrong outcome displayed

**File:** `src/components/post-card.tsx:117-139`

**Issue:** The outcome badge logic is:
```
if (!settled) → "Pending"
else if (outcome === "Awarded") → "Awarded"
else → "Rejected"          // catches null AND any unexpected string
```

If a post is `settled: true` but `outcome` is `null` (which can happen if a DB migration populates `settled` without `outcome`, or a bug in the settlement transaction marks the post settled but fails to write the outcome), the card silently displays "Rejected". This is a data integrity masquerade — a post without a determined outcome looks like a deliberate rejection.

**Fix:**
```typescript
} else if (outcome === "Rejected") {
  outcomeBadge = <span>...</span>  // "Rejected"
} else {
  // outcome is null or unexpected — settled but indeterminate
  outcomeBadge = (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      <XCircle className="h-4 w-4" />
      Unknown
    </span>
  )
}
```

---

### WR-04: `retractVote` does not re-fetch `settled` at the moment of delete — TOCTOU window on `settled` check

**File:** `src/trpc/routers/post.ts:237-250`

**Issue:** The `retractVote` procedure fetches `{ votingEndsAt, settled }` and then checks `post.settled || post.votingEndsAt <= new Date()`. But the `deleteMany` that follows is not inside a transaction that re-checks the `settled` flag atomically. If the settlement cron fires between the `findUnique` and the `deleteMany`, the vote can be deleted after settlement has already read the votes array. This creates a rare but possible race: settlement reads votes (including this vote), calculates the outcome, then the retract deletes the vote, and the balance update proceeds based on vote data that no longer reflects reality.

**Fix:** Wrap the check and delete in a transaction, or add a conditional delete that only fires if `votingEndsAt > NOW()`:
```typescript
// Only delete if voting window is still open (atomic via DB predicate):
await db.vote.deleteMany({
  where: {
    postId: input.postId,
    userId,
    post: { settled: false, votingEndsAt: { gt: new Date() } },
  },
})
```

---

### WR-05: `void fetchNextPage()` in intersection observer — errors swallowed silently in infinite scroll

**File:** `src/components/feed/feed-list.tsx:121`

**Issue:** `void fetchNextPage()` discards the returned promise. If `fetchNextPage` throws (network error, server error), the error is silently lost. The user sees no error message and the feed stops loading more items without explanation.

**Fix:**
```typescript
fetchNextPage().catch((err) => {
  console.error("Failed to fetch next page:", err)
  // Optionally: toast.error("Failed to load more posts.")
})
```

---

## Info

### IN-01: `vote-router.test.ts` is entirely `.todo` — zero coverage on castVote/retractVote server procedures

**File:** `tests/unit/vote-router.test.ts:1-18`

**Issue:** All 9 test cases for `castVote` and `retractVote` are `test.todo`. The security-critical server-side checks (FORBIDDEN when voting on own post, FORBIDDEN when window closed, upsert deduplication) have no unit-test coverage. The comment says "filled in after Wave 1 procedures are implemented" but the procedures are now implemented.

**Fix:** Implement the integration tests. At minimum: `rejects unauthenticated`, `throws FORBIDDEN when votingEndsAt passed`, and `throws FORBIDDEN when voting on own post` should be covered before shipping.

---

### IN-02: `replyCount` is silently ignored in `PostHistoryTabs` — hardcoded zeros passed for agreeCount/disagreeCount

**File:** `src/components/profile/post-history-tabs.tsx:135-137`

**Issue:** The `TabPanel` renders `PostCard` with `agreeCount={0}` and `disagreeCount={0}` hardcoded, and does not pass `replyCount`. The `getPostHistory` query may or may not return these counts — if it does, they are silently dropped. If it doesn't, the history view will always show 0/0 which is misleading for settled posts.

**Fix:** Either pass real counts from the `getPostHistory` query response (if available), or add a comment documenting that history view intentionally shows no counts. Check what `getPostHistory` returns and align accordingly.

---

### IN-03: `getMediaType` defaults to `"image"` for all unrecognized extensions including non-media URLs

**File:** `src/components/post-card.tsx:68-74`

**Issue:** `getMediaType` returns `"image"` for any URL that does not end in a known video extension. If a non-image URL is somehow stored in `mediaUrl` (e.g., a PDF, a redirect URL, or a malformed uploadthing URL), an `<img>` tag will be rendered with a broken image rather than failing gracefully.

**Fix:** This is a low-risk issue given that uploadthing controls the upload pipeline, but consider logging a warning or restricting `getMediaType` callers to only fire after validation at the upload layer.

---

_Reviewed: 2026-06-17T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
