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
  critical: 2
  warning: 4
  info: 3
  total: 9
status: fixed
fixed_at: 2026-06-17T00:00:00Z
fixed_findings: [CR-01, CR-02, WR-01, WR-02, WR-03, WR-04]
open_findings: [IN-01, IN-02, IN-03]
---

# Phase 04: Code Review Report

**Reviewed:** 2026-06-17T00:00:00Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

This phase delivers voting (cast/flip/retract) and cron-based settlement for AWARD/DEDUCT posts. The core settlement logic in `settlePost` is correct and well-tested for the cases covered. The tRPC router security posture is sound: userId always from session, self-vote blocked server-side, voting window enforced before DB write.

Two blockers were found. First, the test data-write endpoint (`/api/test/seed-post`) uses `NODE_ENV === "production"` as its sole guard, which does not protect Vercel Preview deployments — Vercel sets `NODE_ENV=production` for all serverless function environments regardless of deployment target. Second, the test seed route stores `cpAmount: -3` for DEDUCT posts, while `settlePost` unconditionally calls `{ decrement: post.cpAmount }`. When `cpAmount` is negative, Prisma's `decrement` becomes an addition — the target user's balance increases instead of decreasing. The `createPostSchema` prevents this for user-created posts via `min(1)`, but the seed route bypasses all schema validation.

Four warnings cover: a global `isPending` flag disabling all vote buttons across the entire feed during any single mutation; vote counts missing from the profile history view (hardcoded to 0/0); a TOCTOU race in `retractVote` between the `settled` check and the `deleteMany`; and the `PostCard` outcome badge falling through to "Rejected" for `outcome === null` on a settled post. Three info items address dead `explanation` payload, the all-todo vote router test file, and flaky `waitForTimeout` usage in E2E setup.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Test data-write endpoint exposed on Vercel Preview deployments

**File:** `src/app/api/test/seed-post/route.ts:6` and `:38`

**Issue:** Both the POST and DELETE handlers are guarded by `process.env.NODE_ENV === "production"`. Vercel sets `NODE_ENV=production` for all serverless function environments — including Preview deployments — because Next.js requires `NODE_ENV=production` for an optimized build. The variable that distinguishes production from preview on Vercel is `VERCEL_ENV` (`"production"` vs `"preview"`). As a result, any publicly-accessible Vercel Preview URL exposes `/api/test/seed-post` as a fully functional endpoint: any unauthenticated HTTP client can write arbitrary posts to the database or delete any post by ID with no authentication required.

**Fix:** Replace the `NODE_ENV` guard with one that blocks on all hosted environments, or require a dedicated secret:

```typescript
// Option A — block when running on Vercel at all (preview + production)
if (process.env.VERCEL_ENV) {
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

// Option B — require an explicit E2E secret (prevents exposure even if env leaks)
const provided = req.headers.get("authorization")?.replace("Bearer ", "")
if (!process.env.E2E_SECRET || provided !== process.env.E2E_SECRET) {
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}
```

Apply to both the POST handler (line 6) and the DELETE handler (line 38).

---

### CR-02: Settlement decrement with negative `cpAmount` becomes an increment

**File:** `src/lib/settlement.ts:44` and `src/app/api/test/seed-post/route.ts:25`

**Issue:** `settlePost` applies `{ decrement: post.cpAmount }` for an Awarded DEDUCT post. Prisma interprets `decrement: N` as `cigmaPoints = cigmaPoints - N`. When `cpAmount` is negative (e.g. `-3`), this evaluates to `cigmaPoints - (-3) = cigmaPoints + 3` — the target user gains points instead of losing them.

The test seed route stores `cpAmount: -3` for DEDUCT-typed posts (line 25):
```typescript
cpAmount: outcome === "Awarded" ? 5 : -3,
```

The `createPostSchema` prevents this for user-created posts via `.min(1)`, so the settlement function is safe for all posts created through the normal tRPC path. However the seed route bypasses schema validation entirely, writing a negative `cpAmount` directly via `db.post.create`. Any E2E test that seeds a DEDUCT post and then triggers settlement (directly or via the cron endpoint) would silently credit the target user. Additionally, the sign convention is undocumented in `settlement.ts`, making it a latent trap for any future admin write path.

**Fix:** Store `cpAmount` as a positive integer in the seed route (direction is conveyed by the `type` field):

```typescript
// src/app/api/test/seed-post/route.ts:25
cpAmount: 5,  // always positive; type: "AWARD" | "DEDUCT" carries direction
```

Add a defensive guard in `settlePost` to make the invariant explicit:

```typescript
// src/lib/settlement.ts — after computing outcome, before the ops array
if (post.cpAmount <= 0) {
  throw new Error(`settlePost: cpAmount must be positive, got ${post.cpAmount} for post ${post.id}`)
}
```

---

## Warnings

### WR-01: Global `isPending` disables all vote buttons during any single mutation

**File:** `src/components/feed/feed-list.tsx:116-158`

**Issue:** A single boolean `isPending = castVoteMutation.isPending || retractVoteMutation.isPending` is passed uniformly to every `PostCard` in the rendered list. While one vote mutation is in-flight for any single post, every vote button across the entire visible feed is disabled. A user scrolling through 20 posts who votes on post 1 cannot interact with posts 2–20 until the network round-trip completes. The intent is to prevent double-submission on the same post, not to lock the entire feed.

**Fix:** Track pending state per post ID:

```typescript
const [pendingIds, setPendingIds] = React.useState<Set<string>>(new Set())

// In castVoteMutation onMutate:
onMutate: async ({ postId, type }) => {
  setPendingIds((prev) => new Set(prev).add(postId))
  // ... existing snapshot logic ...
},
onSettled: (_data, _err, { postId }) => {
  setPendingIds((prev) => { const s = new Set(prev); s.delete(postId); return s })
  void queryClient.invalidateQueries(trpc.post.getFeed.queryFilter())
},

// In render:
isPending={pendingIds.has(item.id)}
```

Apply the same pattern to `retractVoteMutation`.

---

### WR-02: `PostHistoryTabs` hardcodes `agreeCount={0}` and `disagreeCount={0}`

**File:** `src/components/profile/post-history-tabs.tsx:135-136`

**Issue:** Every `PostCard` rendered in the profile history view always shows "Agree: 0  Disagree: 0" regardless of actual vote tallies. The `getPostHistory` query in `src/trpc/routers/user.ts` selects `_count: { votes: true }` (total vote count only, not split by type), so even if the component attempted to use real data, the split values are not available. For settled posts, where the vote outcome determined a real points transfer, displaying 0/0 is actively misleading.

**Fix:** Update `getPostHistory` to return split vote counts:

```typescript
// src/trpc/routers/user.ts — getPostHistory select
votes: { select: { type: true } },   // replace _count: { votes: true }

// map the items before returning:
const mapped = items.map((post) => {
  const { votes, ...rest } = post
  return {
    ...rest,
    agreeCount: votes.filter((v) => v.type === "AGREE").length,
    disagreeCount: votes.filter((v) => v.type === "DISAGREE").length,
  }
})
return { items: mapped, nextCursor }
```

Then pass `item.agreeCount` and `item.disagreeCount` to `PostCard` in `post-history-tabs.tsx`.

---

### WR-03: `PostCard` outcome badge silently renders "Rejected" when `outcome === null`

**File:** `src/components/post-card.tsx:117-139`

**Issue:** The outcome badge logic is:
```
if (!settled)             → "Pending"
else if (outcome === "Awarded") → "Awarded"
else                      → "Rejected"   ← catches null AND unexpected strings
```

If a post is `settled: true` but `outcome` is `null` — possible if the settlement transaction's post-update write succeeds but the balance update fails and the transaction is partially committed, or via any direct DB access — the card displays "Rejected" with no indication that the outcome is actually indeterminate. A user seeing "Rejected" has no way to know the settlement was incomplete.

**Fix:** Add an explicit null branch:

```typescript
} else if (outcome === "Rejected") {
  outcomeBadge = (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      <XCircle className="h-4 w-4" />
      Rejected
    </span>
  )
} else {
  // outcome is null or unexpected value — settled flag is set but outcome is indeterminate
  outcomeBadge = (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      <XCircle className="h-4 w-4" />
      Unknown
    </span>
  )
}
```

---

### WR-04: TOCTOU race in `retractVote` between the `settled` check and `deleteMany`

**File:** `src/trpc/routers/post.ts:237-250`

**Issue:** `retractVote` reads `{ votingEndsAt, settled }` via `findUnique`, checks that voting is still open, then calls `deleteMany`. The check and the delete are not atomic. If the settlement cron fires between the `findUnique` and the `deleteMany` — a real possibility at the 15-minute cron interval — the vote is deleted after settlement has already read the votes array and computed the outcome. The balance update then applies based on a vote set that no longer matches the stored data.

This is admittedly a narrow race window, but the fix is straightforward.

**Fix:** Move the settlement guard into the `deleteMany` predicate so the delete is a no-op if the post was settled in the interim:

```typescript
await db.vote.deleteMany({
  where: {
    postId: input.postId,
    userId,
    post: {
      settled: false,
      votingEndsAt: { gt: new Date() },
    },
  },
})
```

This makes the delete conditional at the DB level with no additional round-trip.

---

## Info

### IN-01: `explanation` fetched in `getFeed` but never rendered — dead wire payload

**File:** `src/trpc/routers/post.ts:104`

**Issue:** The `getFeed` select includes `explanation: true`. `PostCard` and `PostCardProps` have no `explanation` prop, so the field is fetched, serialized, and transmitted on every feed load then silently dropped. The inline comment says "zero-cost, avoids a future schema change" but it is not zero-cost at the transport layer — it adds bytes to every paginated feed response.

**Fix:** Remove `explanation: true` from the select until it is actually rendered. Bringing it back requires only one line change and no schema migration.

---

### IN-02: `vote-router.test.ts` is entirely `test.todo` — zero coverage of security-critical guards

**File:** `tests/unit/vote-router.test.ts:1-18`

**Issue:** All eight test stubs in `vote-router.test.ts` are `test.todo`. The file exists as a placeholder. The security guards this file was meant to cover — unauthenticated rejection, self-vote block, closed-window enforcement — are the highest-risk correctness properties in the entire voting system. The comment "filled in after Wave 1 procedures are implemented" is stale; the procedures are fully implemented.

**Fix:** Implement at minimum these three cases before considering the phase done:
- `castVote` throws `FORBIDDEN` when `votingEndsAt` has passed
- `castVote` throws `FORBIDDEN` when `authorId === userId`
- `retractVote` throws `FORBIDDEN` when `settled: true`

---

### IN-03: E2E `setUsername` helper uses `waitForTimeout(500)` — flaky fixed-delay synchronization

**File:** `tests/e2e/voting.spec.ts:49` and `tests/e2e/settlement-outcome.spec.ts:49`

**Issue:** Both E2E test files share the same `setUsername` helper that ends with `await page.waitForTimeout(500)`. Fixed-delay waits are the canonical source of flaky tests: they pass on fast runs and fail when the server is slow or under load. The test suite has no resilience guarantee for this setup step.

**Fix:** Replace with a deterministic Playwright assertion that waits for the profile-edit success toast or for the username field to reflect the saved value:

```typescript
async function setUsername(page: Page, username: string) {
  await page.goto("/profile/edit")
  const field = page.getByLabel(/username/i)
  await field.clear()
  await field.fill(username)
  await page.getByRole("button", { name: /save/i }).click()
  // Wait for confirmation — exact selector depends on what the form shows on success
  await expect(page.getByText(/saved|updated/i)).toBeVisible({ timeout: 5000 })
}
```

---

_Reviewed: 2026-06-17T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
