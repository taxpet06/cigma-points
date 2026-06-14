---
phase: 02-user-profiles
plan: "02"
subsystem: ui-components
tags: [post-card, post-history, tabs, infinite-query, ui]
dependency_graph:
  requires: ["02-01"]
  provides: ["PostCard component", "PostHistoryTabs component", "shadcn Tabs primitive"]
  affects: ["02-03", "phase-03-feed"]
tech_stack:
  added: ["@radix-ui/react-tabs (via shadcn tabs)"]
  patterns: ["infiniteQueryOptions cursor pagination", "shadcn Tabs uncontrolled", "Intl.RelativeTimeFormat native date formatting"]
key_files:
  created:
    - src/components/ui/tabs.tsx
    - src/components/post-card.tsx
    - src/components/profile/post-history-tabs.tsx
  modified:
    - package.json
    - package-lock.json
decisions:
  - "Used native Intl.RelativeTimeFormat for relative timestamps instead of adding date-fns (no extra dependency)"
  - "Extracted TabPanel sub-component to co-locate each tab's infinite query with its render logic"
  - "Phase 3 forward-compat optional props destructured with _-prefix aliases to satisfy TypeScript no-unused-vars without lint errors"
metrics:
  duration: "~8 minutes"
  completed: "2026-06-14"
  tasks_completed: 2
  files_created: 3
  files_modified: 2
---

# Phase 02 Plan 02: Feed-Card Slice Summary

**One-liner:** Shared PostCard component with AWARD/DEDUCT badges and Phase 3 forward-compat props, plus PostHistoryTabs client component backed by cursor-paginated getPostHistory infinite query.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install shadcn Tabs + build shared PostCard component | 2456ce8 | src/components/ui/tabs.tsx, src/components/post-card.tsx, package.json, package-lock.json |
| 2 | PostHistoryTabs client component with Sent/Received infinite query | 7b3583b | src/components/profile/post-history-tabs.tsx |

## What Was Built

### PostCard (`src/components/post-card.tsx`)
- Exported `PostCard` component and `PostCardProps` interface
- Type badges: AWARD (`text-emerald-600 bg-emerald-50` + ArrowUpCircle), DEDUCT (`text-red-600 bg-red-50` + ArrowDownCircle)
- Outcome badges: settled+Awarded (CheckCircle2 emerald), settled+Rejected (XCircle muted), not settled (Clock amber "Pending")
- Author → target display with Avatar (h-10 w-10) + UserCircle fallback
- Relative timestamp via native `Intl.RelativeTimeFormat` (no date-fns needed)
- Footer: vote count + voting deadline formatted with `Intl` locale string
- `aria-label` on type badge: "Award post" / "Deduct post" (accessibility contract)
- Phase 3 forward-compat optional props: `mediaUrl`, `replyCount`, `agreeCount`, `disagreeCount` (accepted, not rendered)
- 220 lines (exceeds 40-line minimum artifact requirement)

### shadcn Tabs (`src/components/ui/tabs.tsx`)
- Installed via `npx shadcn@latest add tabs`
- Exports: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

### PostHistoryTabs (`src/components/profile/post-history-tabs.tsx`)
- `"use client"` component exporting `PostHistoryTabs({ userId })`
- Two `TabPanel` sub-components, each running an independent `useInfiniteQuery` backed by `trpc.user.getPostHistory.infiniteQueryOptions`
- `defaultValue="sent"` — uncontrolled (no URL sync per Don't Hand-Roll)
- Loading state: 3 animated skeleton cards (`bg-muted animate-pulse`) matching card dimensions
- Empty state: tab-specific heading + body copy, wrapped in `<div role="status">`
- Load more: `<Button variant="outline">` disabled with "Loading…" while `isFetchingNextPage`

## Verification

- `npx tsc --noEmit` exits 0 (verified after each task and at plan end)
- PostCard exports `PostCard` with `PostCardProps` including all required fields and Phase 3 optional props
- PostHistoryTabs starts with `"use client"`, contains 2 `getPostHistory` calls, 1 "Load more", both empty-state strings, and 2 `role="status"` attributes

## Deviations from Plan

None — plan executed exactly as written.

The one minor implementation detail: `Intl.RelativeTimeFormat` was used for relative timestamps instead of any date library. The plan said "relative timestamp from createdAt" without specifying a library. Since no date library was installed in the project, the native Intl API was used directly (no install, no dependency, same output). This is strictly additive — no plan requirement violated.

## Known Stubs

None — all PostCard fields are wired to live data from the getPostHistory query response. No hardcoded placeholders in rendered output.

## Threat Surface Scan

No new network endpoints or auth paths introduced. PostHistoryTabs calls `getPostHistory` (a `protectedProcedure` — existing surface, built in Plan 01). PostCard is a pure render component with no network calls. No new threat surface beyond what Plan 01's `getPostHistory` procedure already registered.

## Self-Check: PASSED

- `src/components/ui/tabs.tsx` — exists and exports Tabs, TabsList, TabsTrigger, TabsContent
- `src/components/post-card.tsx` — exists, exports PostCard, 220 lines
- `src/components/profile/post-history-tabs.tsx` — exists, starts with "use client"
- Commits 2456ce8 and 7b3583b — verified in git log
- `npx tsc --noEmit` — exits 0
