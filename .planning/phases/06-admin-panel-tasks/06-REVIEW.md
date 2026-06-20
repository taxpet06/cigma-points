---
phase: 06-admin-panel-tasks
reviewed: 2026-06-20T00:46:08Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - prisma/schema.prisma
  - src/app/admin/page.tsx
  - src/app/post/[id]/page.tsx
  - src/app/tasks/[id]/page.tsx
  - src/app/tasks/page.tsx
  - src/components/admin/user-table.tsx
  - src/components/feed/feed-list.tsx
  - src/components/nav/header.tsx
  - src/components/post-card.tsx
  - src/components/profile/post-history-tabs.tsx
  - src/components/tasks/create-task-modal.tsx
  - src/components/tasks/task-card.tsx
  - src/components/tasks/task-reply-card.tsx
  - src/components/tasks/task-thread-section.tsx
  - src/components/tasks/task-thread.tsx
  - src/components/thread/reply-compose.tsx
  - src/lib/validation/reply.ts
  - src/lib/validation/task.ts
  - src/trpc/routers/admin.ts
  - src/trpc/routers/_app.ts
  - src/trpc/routers/reply.ts
  - src/trpc/routers/task.ts
  - tests/e2e/admin-tasks.spec.ts
  - tests/unit/task-schema.test.ts
findings:
  critical: 3
  warning: 4
  info: 3
  total: 10
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-06-20T00:46:08Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

Phase 06 ships an admin panel (user balance editing, task creation), task post listing and detail pages, threaded task replies, and a Mark Complete flow that awards CP. The security fundamentals are sound: every admin-only tRPC procedure carries an explicit FORBIDDEN role check in addition to middleware enforcement, `getAllUsers` never returns password fields, and `completeTask` wraps balance modification in a `$transaction`. The XOR refine on `createReplySchema` is correct and unit-tested.

Three bugs require fixes before this code ships:

1. The inline balance editor in `AdminUserTable` has an Escape-key cancellation failure: pressing Escape saves the in-progress edit value rather than discarding it, due to a `blur` event firing after the `keydown` handler clears editing state.
2. The same editor fires two `updateBalance` mutations on Enter (one from `onKeyDown`, one from the subsequent `blur`).
3. The `completeTask` mutation has a TOCTOU race where two concurrent admin sessions can both pass the idempotency guard and double-increment a user's CP balance.

Four additional warnings and three info items are documented below.

---

## Critical Issues

### CR-01: Escape key cancels the edit visually but immediately saves it via `onBlur`

**File:** `src/components/admin/user-table.tsx:139-141`

**Issue:** When the admin presses Escape to cancel an inline balance edit, the browser fires `blur` on the input after the `keydown` handler runs. The sequence:

1. `onKeyDown`: `cancelEdit()` calls `setEditingId(null)` — React state update is **queued, not flushed**
2. Browser: input loses focus and fires `blur`
3. `onBlur`: `commitEdit(user.id)` fires unconditionally — `editingId` is still non-null in the current closure, so no guard trips
4. `commitEdit` calls `updateBalance.mutate({ userId, newBalance: editValue })`

Net result: pressing Escape commits the partially-entered value instead of discarding it. The user sees the edit field disappear (correct) but the balance is written to the DB (incorrect).

**Fix:** Use a ref to track whether the current close is a save or a cancel before `blur` has a chance to fire:

```tsx
const committingRef = useRef(false)

function commitEdit(userId: string) {
  committingRef.current = true
  setEditingId(null)
  updateBalance.mutate({ userId, newBalance: editValue })
}

function cancelEdit() {
  committingRef.current = true  // cancel also uses the ref to block onBlur
  setEditingId(null)
}

// In the input:
onBlur={() => {
  if (!committingRef.current) commitEdit(user.id)
  committingRef.current = false
}}
onKeyDown={(e) => {
  if (e.key === "Enter") { e.preventDefault(); commitEdit(user.id) }
  if (e.key === "Escape") { e.preventDefault(); cancelEdit() }
}}
```

---

### CR-02: Enter key fires two `updateBalance` mutations — one from `onKeyDown`, one from `onBlur`

**File:** `src/components/admin/user-table.tsx:138-141`

**Issue:** Pressing Enter in the balance input triggers:

1. `onKeyDown`: `commitEdit(user.id)` — fires `updateBalance.mutate(...)`, queues `setEditingId(null)`
2. Browser: Enter causes the input to blur — `onBlur` fires
3. `onBlur`: `commitEdit(user.id)` — fires **a second** `updateBalance.mutate(...)`

Because `setEditingId(null)` from step 1 has not flushed when step 3 runs, `commitEdit` has no guard to prevent the second mutation. Two identical API calls are dispatched with the same payload. While idempotent today (both set the same value), this also fires two `invalidateQueries` calls and two `setLocalBalances` state updates, and will become a data integrity issue if the mutation is ever changed to increment rather than set.

**Fix:** The ref approach from CR-01 prevents both issues simultaneously. The `committingRef = true` set in `commitEdit` ensures that when `onBlur` fires immediately after `onKeyDown`'s `commitEdit`, the ref guard prevents a second call. Alternatively, add an `isPending` guard:

```tsx
function commitEdit(userId: string) {
  if (updateBalance.isPending) return
  setEditingId(null)
  updateBalance.mutate({ userId, newBalance: editValue })
}
```

---

### CR-03: TOCTOU race in `completeTask` — concurrent admin clicks can double-award CP

**File:** `src/trpc/routers/task.ts:168-193`

**Issue:** The idempotency guard reads `taskCompletion.findUnique` *outside* the `$transaction`:

```ts
// Step A — read (outside transaction)
const existing = await db.taskCompletion.findUnique({ ... })
if (existing?.status === "AWARDED") {
  throw new TRPCError({ code: "BAD_REQUEST", message: "Already awarded." })
}

// Step B — write (inside transaction)
await db.$transaction([
  db.taskCompletion.upsert({ ..., status: "AWARDED" }),
  db.user.update({ data: { cigmaPoints: { increment: task.cpReward } } }),
])
```

If two admin requests execute concurrently, both can read `null` at Step A, both pass the guard, and both execute Step B. The `upsert` in Step B is idempotent (second call just sets `AWARDED` again), but `cigmaPoints: { increment: task.cpReward }` runs **twice**, awarding double CP to the user. The `$transaction` array form guarantees atomicity of the two operations inside each call, but provides no cross-request isolation.

**Fix:** Move the idempotency check inside an interactive transaction and rely on the unique constraint (`taskId_userId`) to serialize concurrent requests:

```ts
const awarded = await db.$transaction(async (tx) => {
  // Attempt to create the completion record; unique constraint blocks concurrent creates
  const existing = await tx.taskCompletion.findUnique({
    where: { taskId_userId: { taskId: input.taskId, userId: reply.authorId } },
    select: { status: true },
  })
  if (existing?.status === "AWARDED") {
    return false  // already done — caller will throw BAD_REQUEST
  }
  await tx.taskCompletion.upsert({
    where: { taskId_userId: { taskId: input.taskId, userId: reply.authorId } },
    update: { status: "AWARDED", awardedCp: task.cpReward },
    create: { taskId: input.taskId, userId: reply.authorId, status: "AWARDED", awardedCp: task.cpReward },
  })
  await tx.user.update({
    where: { id: reply.authorId },
    data: { cigmaPoints: { increment: task.cpReward } },
  })
  return true
})

if (!awarded) {
  throw new TRPCError({ code: "BAD_REQUEST", message: "Already awarded." })
}
```

Using an interactive transaction (`async (tx) => { ... }`) with Prisma NeonAdapter requires `DIRECT_URL` to be set for interactive transactions (check `src/lib/db.ts` for adapter configuration). If the adapter does not support interactive transactions, the alternative is to use `updateMany` with a `WHERE status = PENDING` condition and check `count > 0` before incrementing, which turns the non-found case into a no-op rather than a double-increment.

---

## Warnings

### WR-01: `Task.cpReward` is nullable in the schema but `completeTask` conflates null with NOT_FOUND

**File:** `prisma/schema.prisma:185`, `src/trpc/routers/task.ts:155-157`

**Issue:** `Task.cpReward` is `Int?` (nullable) in the Prisma schema. The `completeTask` procedure checks:

```ts
if (!task || !task.cpReward) {
  throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." })
}
```

A task with `cpReward = null` (possible via direct DB write or a pre-validation task) returns the misleading error "Task not found" when the task exists. More importantly, if the guard were ever removed or changed and `task.cpReward` were `null`, the `$transaction` would call `db.user.update({ data: { cigmaPoints: { increment: null } } })` — undefined behaviour in Prisma (likely treated as `increment: 0`, silently awarding nothing).

Since `createTaskSchema` enforces `cpReward >= 1`, the schema field should reflect this constraint:

**Fix (preferred):** Make `cpReward` non-nullable in the schema:
```prisma
cpReward    Int   // was Int? — remove nullable; createTaskSchema min(1) enforces non-null at creation
```

**Fix (if nullable must be kept):** Use distinct error codes:
```ts
if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." })
if (!task.cpReward) throw new TRPCError({ code: "BAD_REQUEST", message: "Task has no CP reward." })
```

---

### WR-02: `reply.taskId!` non-null assertion in `TaskReplyCard` is unsafe

**File:** `src/components/tasks/task-reply-card.tsx:91`, `src/components/tasks/task-reply-card.tsx:149`

**Issue:** `TaskReplyNode` types `taskId` as `string | null`. The component uses `reply.taskId!` in two places:

```tsx
trpc.task.getTaskReplies.queryFilter({ taskId: reply.taskId! })
completeTask.mutate({ taskId: reply.taskId!, replyId: reply.id })
```

All replies returned by `getTaskReplies` do have `taskId` set (the query filters `WHERE taskId = ?`), so this is currently safe. However, the non-null assertion suppresses TypeScript's null check. If a future refactor accidentally passes a post-reply node to `TaskReplyCard` (type-compatible: `TaskReplyNode` shape is structurally close to a post reply node), the assertion passes at compile time and `taskId` will be `null` at runtime. `completeTask` receives `taskId: null`, the `completeTaskSchema` (`z.string().min(1)`) rejects it, and the error surfaces as an unhandled toast (since `onError` only calls `toast.error`, not a crash — but the query invalidation using `{ taskId: null }` could mismatch cache keys).

**Fix:** Thread `taskId` as a required prop instead of sourcing it from the potentially-null reply field:

```tsx
interface TaskReplyCardProps {
  reply: TaskReplyNode
  taskId: string      // explicit, required — passed from TaskReplyThread
  depth: number
  onReply: (authorUsername: string, replyId: string) => void
}

// Remove reply.taskId! usages; use the prop instead
completeTask.mutate({ taskId, replyId: reply.id })
queryFilter({ taskId })
```

---

### WR-03: No database-level constraint enforces `Reply.postId XOR Reply.taskId`

**File:** `prisma/schema.prisma:159-177`

**Issue:** The `Reply` model allows both `postId` and `taskId` to be `null` simultaneously. The XOR invariant is only enforced by the Zod `refine` in `createReplySchema`. A direct DB insert, a seed script, or any future tRPC procedure that bypasses `createReplySchema` can create orphaned reply records (`postId = NULL AND taskId = NULL`). Such records are invisible to all read queries (`getReplies` filters by `postId`, `getTaskReplies` filters by `taskId`) and silently accumulate in the table.

**Fix:** Add a database CHECK constraint via a raw SQL migration:

```sql
ALTER TABLE replies
  ADD CONSTRAINT reply_thread_xor
  CHECK (
    (post_id IS NOT NULL AND task_id IS NULL) OR
    (post_id IS NULL AND task_id IS NOT NULL)
  );
```

If Prisma-level CHECK constraints are preferred, add to the schema and generate a raw migration:
```prisma
@@check(name: "reply_thread_xor", "(post_id IS NOT NULL) != (task_id IS NOT NULL)")
```

---

### WR-04: TASK-01 E2E test silently passes when the task detail page is never navigated to

**File:** `tests/e2e/admin-tasks.spec.ts:134-141`

**Issue:** TASK-01's detail page navigation is wrapped in a `catch(() => false)` guard:

```ts
if (await taskCard.isVisible({ timeout: 5000 }).catch(() => false)) {
  const detailLink = taskCard.locator("a").first()
  await detailLink.click()
  await expect(page).toHaveURL(/\/tasks\//, ...)
  await expect(page.getByText(TASK_TITLE)).toBeVisible()
}
```

If `TASK_TITLE` is not visible (e.g., ADMN-02 was skipped, the task was not created, or the /tasks page has a rendering bug), the entire navigation and assertion block is silently skipped and the test still passes. TASK-01's stated purpose is to verify that `/tasks/[id]` opens and displays the correct task. In serial mode ADMN-02 always precedes TASK-01, but the guard makes the test vacuously green when the task-detail flow is broken.

**Fix:** Remove the conditional guard; assert the task is visible unconditionally (the serial test ordering guarantees ADMN-02's task exists):

```ts
await expect(page.getByText(TASK_TITLE)).toBeVisible({ timeout: 10000 })
const taskLink = page.locator('a[href^="/tasks/"]').first()
await taskLink.click()
await expect(page).toHaveURL(/\/tasks\//, { timeout: 10000 })
await expect(page.getByText(TASK_TITLE)).toBeVisible()
```

---

## Info

### IN-01: `formatRelativeTime` and `getMediaType` are duplicated across three files

**Files:** `src/components/tasks/task-card.tsx:33-55`, `src/components/tasks/task-reply-card.tsx:28-55`, `src/components/post-card.tsx:54-76`

**Issue:** Both `formatRelativeTime` and `getMediaType` are copied verbatim into `task-card.tsx` and `task-reply-card.tsx` from `post-card.tsx`. The comments on both task files say "copied verbatim from post-card.tsx — do not reimplement." A bug fix in one copy does not propagate to the others.

**Fix:** Extract to `src/lib/format.ts` and import from all three components.

---

### IN-02: `Pending` completion status badge is dead code — no flow creates a `PENDING` `TaskCompletion`

**File:** `src/components/tasks/task-reply-card.tsx:131-139`

**Issue:** The amber "Pending" badge renders when `completion` exists and `completion.status !== "AWARDED"`. However, the only code path that creates `TaskCompletion` records is `completeTask`, which always sets `status: "AWARDED"` in both the `create` and `update` branches of the upsert. The `PENDING` default in the schema only applies to direct DB inserts. This badge is unreachable in production.

If the intended design is a two-step flow (user self-reports completion → status=PENDING, admin confirms → status=AWARDED), the self-report mutation is missing. If PENDING is reserved for future use, the badge branch is dead code and should be removed to prevent confusion.

**Fix:** Either add the self-report mutation that creates PENDING records, or remove the `} : completion ? (...)` dead branch from `task-reply-card.tsx`.

---

### IN-03: `console.error` debug artifact in `CreateTaskModal` upload error handler

**File:** `src/components/tasks/create-task-modal.tsx:175`

**Issue:** `console.error("Upload failed:", err.message)` is a debug artifact. The sibling component `ReplyCompose` uses `toast.error(...)` for the equivalent error path, which is the consistent pattern. The admin sees no visible feedback from this path — only a browser console entry.

**Fix:**
```tsx
onUploadError={(err) => {
  toast.error(`Upload failed: ${err.message}`)
}}
```

---

_Reviewed: 2026-06-20T00:46:08Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
