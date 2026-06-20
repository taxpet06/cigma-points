---
phase: 06-admin-panel-tasks
plan: 04
subsystem: frontend/e2e
tags: [playwright, e2e, reconciliation, admin, tasks, selectors]
dependency_graph:
  requires:
    - AdminUserTable (Plan 06-02)
    - CreateTaskModal (Plan 06-02)
    - /tasks page (Plan 06-03)
    - /tasks/[id] page (Plan 06-03)
    - TaskReplyCard + TaskThreadSection (Plan 06-03)
    - ReplyCompose taskId extension (Plan 06-03)
  provides:
    - Passing E2E coverage for all 6 Phase 6 requirements (ADMN-01/02/03, TASK-01/02/03)
    - Media-on-task test remains test.skip (requires real UPLOADTHING_TOKEN)
  affects:
    - tests/e2e/admin-tasks.spec.ts (reconciled selectors, false-positive fix)
    - src/components/admin/user-table.tsx (localBalances optimistic state for ADMN-01 verification)
    - src/components/tasks/create-task-modal.tsx (defaultValues fix to suppress React warning)
tech_stack:
  added: []
  patterns:
    - getByRole("dialog", { name: ... }) — specific dialog locator avoids Next.js overlay ambiguity
    - getByRole("region", { name: "Replies" }) — scoped reply text check prevents false positives
    - expect(button).toBeEnabled() guard before click() — waits for React re-render after fill()
    - localBalances state map — optimistic CP balance display in SSR-prop-static client component
key_files:
  created: []
  modified:
    - tests/e2e/admin-tasks.spec.ts
    - src/components/admin/user-table.tsx
    - src/components/tasks/create-task-modal.tsx
decisions:
  - "AdminUserTable localBalances state is the correct fix for SSR props not updating after mutation — component receives users as static Server Component props; client invalidation alone does not re-render"
  - "ADMN-02 dialog locator changed to getByRole('dialog', { name: 'Create Task' }) because Next.js dev overlay ALSO has role='dialog' and Playwright strict mode rejects ambiguous matches"
  - "TASK-02 reply check scoped to Replies section — getByText on full page matched textarea value (React controlled input), giving a false positive; repliesSection.getByText() is the correct assertion"
metrics:
  duration: "15 minutes"
  completed: "2026-06-20"
  tasks_completed: 1
  files_changed: 3
---

# Phase 06 Plan 04: E2E Verification Gate Summary

Phase 6 E2E verification complete. All 6 Phase 6 requirements verified end-to-end: ADMN-01 (admin inline balance edit), ADMN-02 (admin creates task), TASK-01 (tasks tab + detail), TASK-02 (user replies to task), ADMN-03 (admin marks complete + Awarded badge), TASK-03 (Pending/Awarded status visible). Media-on-task test remains test.skip (requires real UPLOADTHING_TOKEN, matching Phase 5 THRD-02 pattern).

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Reconcile admin-tasks.spec.ts selectors + fix component bugs | c695ce2 | tests/e2e/admin-tasks.spec.ts, user-table.tsx, create-task-modal.tsx |

## Must-Have Truth Verification

- **E2E ADMN-01 passes: admin edits a CP balance in the user table and the new value persists:** `localBalances` state in `AdminUserTable` tracks optimistically saved values so button text shows new balance immediately after `Enter`; mutation POSTs to `admin.updateBalance` (verified 200 in server logs); test restores original balance
- **E2E ADMN-02 passes: admin creates a task and it appears on /tasks:** Dialog opened, form filled, submitted; task confirmed visible on `/tasks` via `page.getByText(TASK_TITLE)` after `page.goto("/tasks")`
- **E2E TASK-01 passes: an authenticated user sees the Tasks nav link and the task on /tasks:** Header "Tasks" link visible; `/tasks` page shows task; clicking task card navigates to `/tasks/[id]`
- **E2E TASK-02 passes: a user replies to a task and the reply appears:** `expect(postBtn).toBeEnabled()` wait ensures React re-render before click; `repliesSection.getByText(replyText)` correctly verifies reply in thread (not compose box); DB confirms reply row created
- **E2E TASK-03 + ADMN-03 pass: admin marks a reply complete and an Awarded status appears:** Admin sees "Mark Complete" button on reply; clicking triggers `task.completeTask` mutation (DB confirms `status: AWARDED`, `awardedCp: 10`); Awarded badge appears; button disappears

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] AdminUserTable CP balance button not reflecting updated value after mutation**
- **Found during:** Task 1 — ADMN-01 failed with "element not found" for button with text "42"
- **Issue:** `AdminUserTable` receives `users` as static SSR props from Server Component. After `updateBalance` mutation succeeds, `queryClient.invalidateQueries` runs but there is no `useQuery(trpc.admin.getAllUsers)` consumer — the client component never re-renders with new data from the server. The balance button remained at the old value.
- **Fix:** Added `localBalances: Record<string, number>` state. `onSuccess` callback sets `localBalances[variables.userId] = variables.newBalance`. The balance button renders `localBalances[user.id] ?? user.cigmaPoints`.
- **Files modified:** src/components/admin/user-table.tsx
- **Commit:** c695ce2

**2. [Rule 1 - Bug] CreateTaskModal React uncontrolled→controlled input warning causing Next.js error overlay**
- **Found during:** Task 1 — ADMN-02 failed with strict mode violation: `locator('[role="dialog"]')` resolved to 2 elements (Radix dialog + Next.js console-error overlay)
- **Issue:** `defaultValues: { cpReward: 1 }` did not include `title` or `description`. React-hook-form would start those fields as `undefined` and switch to controlled when user types, triggering the React warning "A component is changing an uncontrolled input to be controlled." Next.js dev mode overlays this as a `role="dialog"` error dialog, making the dialog locator ambiguous.
- **Fix:** Added `title: ""` and `description: ""` to `defaultValues` in `CreateTaskModal`. Locator also tightened to `getByRole("dialog", { name: "Create Task" })`.
- **Files modified:** src/components/tasks/create-task-modal.tsx, tests/e2e/admin-tasks.spec.ts
- **Commit:** c695ce2

**3. [Rule 1 - Bug] TASK-02 false positive — reply text matched compose textarea, not thread**
- **Found during:** Task 1 — TASK-02 appeared to pass in early runs but DB showed 0 task replies
- **Issue:** `page.getByText(replyText)` matched the text visible in the controlled `<Textarea>` element after `compose.fill(replyText)` — even before the "Post Reply" button was clicked. Additionally, clicking a disabled button (button was still disabled because React state hadn't updated after `fill()`) produced no mutation call.
- **Fix:** Added `await expect(postBtn).toBeEnabled({ timeout: 5000 })` before `.click()` to ensure the React `content` state update has settled. Changed assertion to `repliesSection.getByText(replyText)` scoped to `getByRole("region", { name: "Replies" })` — the `<section aria-label="Replies">` in `TaskThreadSection`.
- **Files modified:** tests/e2e/admin-tasks.spec.ts
- **Commit:** c695ce2

## Known Stubs

None — all tests exercise real data flows against the live dev server. No mocked responses.

## Threat Flags

No new threat surface introduced. All tests run against the real auth stack using seeded credentials.

- T-6-17 (covered): Admin flows use seeded ADMIN account; regular user cannot see Mark Complete — verified by TASK-01/TASK-03 signed in as regular user (no Mark Complete buttons visible)
- T-6-18 (covered): ADMN-03 test clicks Mark Complete once; verifies Awarded badge appears and button disappears (cannot click twice); idempotency guard on server (Plan 06-01) confirmed via DB (`status: AWARDED` set after single mark)

## Pre-existing E2E Failures (Out of Scope)

The following failures exist on `main` before and after this plan and are not caused by Phase 6 changes:
- `posts-feed.spec.ts › POST-01`: UserAutocomplete search `@${TARGET.username}` not found (Phase 3 UI issue)
- `voting.spec.ts › Setup`: Same UserAutocomplete search failure (Phase 4 UI issue)  
- `settlement-outcome.spec.ts › Setup`: Test API seeding issue (Phase 4 UI issue)

These are logged to `deferred-items.md` as pre-existing Phase 3/4 E2E issues.

## Self-Check: PASSED

Files exist:
- `tests/e2e/admin-tasks.spec.ts` — FOUND (245 lines, >= 60 ✓)
- `src/components/admin/user-table.tsx` — FOUND (modified)
- `src/components/tasks/create-task-modal.tsx` — FOUND (modified)

Commits exist:
- c695ce2 — FOUND (`git log --oneline | grep c695ce2`)

Acceptance criteria:
- `npm run test:e2e -- tests/e2e/admin-tasks.spec.ts`: 6 passed, 1 skipped ✓
- `grep -c "ADMN-01\|ADMN-02\|ADMN-03\|TASK-01\|TASK-02\|TASK-03" admin-tasks.spec.ts` = 20 (>= 6) ✓
- `grep -c "admin@cigma.local" admin-tasks.spec.ts` = 1 (>= 1) ✓
- `grep -c "test.skip" admin-tasks.spec.ts` = 1 (>= 1) ✓
- Unit tests: 85 passed, 1 skipped ✓
