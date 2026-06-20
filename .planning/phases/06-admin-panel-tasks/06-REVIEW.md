---
phase: 06
status: needs-fixes
findings_critical: 3
findings_warning: 5
findings_info: 3
reviewed: 2026-06-19T00:00:00Z
---

## Summary

Phase 6 introduces the admin panel, task creation/listing, threaded task replies, and CP award
flows. Security fundamentals are sound: every admin-only tRPC procedure carries an explicit FORBIDDEN
guard, getAllUsers never returns password fields, and completeTask is wrapped in a $transaction with
an idempotency guard. The XOR refine on createReplySchema is correct and unit-tested. Three critical
issues remain: (1) a double-commit race condition in the CP-balance inline editor that can fire two
identical mutations, (2) the Task schema makes cpReward optional (`Int?`) while the validation
schema requires it (`min(1)`), meaning a task can exist in the DB with `cpReward = null` and
completeTask silently returns NOT_FOUND instead of an actionable error, and (3) the non-null
assertion `reply.taskId!` in TaskReplyCard is unsafe — the value is typed `string | null` and can
legitimately be null for a post reply that is somehow routed to this component, causing a runtime
crash.

---

## Findings

### CRITICAL

---

#### CR-01: Double-commit race condition on Enter + onBlur in AdminUserTable

**File:** `src/components/admin/user-table.tsx:138-141`

**Issue:** The inline-edit input fires `commitEdit(user.id)` on *both* `onKeyDown` (Enter key) and
`onBlur`. When a user presses Enter, the browser immediately blurs the input, so `commitEdit` is
called twice in the same event loop tick before React re-renders. The first call fires
`updateBalance.mutate(...)`, and the second fires a second identical mutation because `editingId` is
not yet null (the `setEditingId(null)` from the first call hasn't flushed). The result is two
consecutive `admin.updateBalance` RPC calls with the same payload; both will succeed and the second
is a redundant write that also triggers two `setLocalBalances` state updates and two
`invalidateQueries` calls. In a concurrent future where balance updates increment rather than set,
this would be a data-loss bug; even today it produces confusing network noise and can cause two
optimistic `localBalances` updates.

**Fix:** Clear `editingId` before calling `mutate`, or gate the second path with a check:

```typescript
function commitEdit(userId: string) {
  if (editingId === null) return   // guard: already committed
  setEditingId(null)               // clear first to block the onBlur re-trigger
  updateBalance.mutate({ userId, newBalance: editValue })
}
```

---

#### CR-02: Schema/router mismatch — `Task.cpReward` is nullable but `completeTask` masks it as NOT_FOUND

**File:** `prisma/schema.prisma:185`, `src/trpc/routers/task.ts:155-156`

**Issue:** `Task.cpReward` is defined as `Int?` in the Prisma schema (nullable). The `createTaskSchema`
validates `cpReward` as `z.coerce.number().int().min(1)` — but this constraint only applies to the
creation form. An admin could have created a task before the min(1) rule existed, or a direct DB
write could set `cpReward = null`. When `completeTask` fetches the task:

```typescript
if (!task || !task.cpReward) {
  throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." })
}
```

A task with `cpReward = null` (or `cpReward = 0` — falsy) triggers a NOT_FOUND response even though
the task exists, giving the admin no useful error. More critically, if `cpReward` is `null`, the
subsequent `db.$transaction` would write `awardedCp: null` and `cigmaPoints: { increment: null }` —
Prisma's `increment: null` is undefined behaviour (it may be treated as 0, leaving the user's
balance unchanged after a supposedly awarded completion). The `NOT_FOUND` guard prevents that path
today, but the wrong error code is confusing and the guard condition conflates two distinct failure
modes.

Either make `cpReward` non-nullable in the schema (it is always required at creation time), or use
a distinct error code:

```typescript
if (!task) {
  throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." })
}
if (!task.cpReward) {
  throw new TRPCError({ code: "BAD_REQUEST", message: "Task has no CP reward configured." })
}
```

And in `prisma/schema.prisma`, change:
```diff
-  cpReward    Int?
+  cpReward    Int
```

---

#### CR-03: Non-null assertion on `reply.taskId!` is unsafe

**File:** `src/components/tasks/task-reply-card.tsx:91`, `src/components/tasks/task-reply-card.tsx:149`

**Issue:** `TaskReplyNode` types `taskId` as `string | null` (inherited from the Prisma query result
which returns `taskId: String?`). The component uses `reply.taskId!` in two places:

```typescript
trpc.task.getTaskReplies.queryFilter({ taskId: reply.taskId! })
completeTask.mutate({ taskId: reply.taskId!, replyId: reply.id })
```

`TaskReplyCard` is only rendered by `TaskReplyThread`, which fetches replies filtered by
`taskId`. In the current code path every reply will have `taskId` set. However, the non-null
assertion bypasses TypeScript's null-safety guarantee. If a future refactor passes a post-reply node
to this component by mistake (the type is compatible), the assertion will pass at compile time but
`taskId` will be `null` at runtime, causing `completeTask` to receive `taskId: null` and
`getTaskReplies` to receive `{ taskId: null }`, resulting in either a Zod validation error surfaced
as an unhandled promise rejection (no `onError` on the `queryFilter` call) or an incorrect query
being fired.

The correct fix is to thread `taskId` as a required prop rather than sourcing it from the reply
node, matching how the parent already knows the `taskId`:

```typescript
// In TaskReplyCard props:
interface TaskReplyCardProps {
  reply: TaskReplyNode
  taskId: string          // required — passed down from TaskReplyThread
  depth: number
  onReply: (authorUsername: string, replyId: string) => void
}

// Usage:
trpc.task.getTaskReplies.queryFilter({ taskId })
completeTask.mutate({ taskId, replyId: reply.id })
```

---

### WARNING

---

#### WR-01: Enter + onBlur double-commit fires updateBalance while `isPending` — no in-flight guard

**File:** `src/components/admin/user-table.tsx:74`

**Issue:** (Related to CR-01 but distinct.) Even after the fix for CR-01, `commitEdit` calls
`updateBalance.mutate(...)` without checking `updateBalance.isPending`. If the admin presses Enter
while a previous mutation is still in-flight (e.g., slow network), a second mutation is queued.
React Query does not automatically deduplicate sequential `mutate` calls on the same key.

**Fix:**
```typescript
function commitEdit(userId: string) {
  if (editingId === null || updateBalance.isPending) return
  setEditingId(null)
  updateBalance.mutate({ userId, newBalance: editValue })
}
```

---

#### WR-02: `Number(e.target.value)` produces NaN for non-numeric input, which is sent silently to server

**File:** `src/components/admin/user-table.tsx:137`

**Issue:** The inline balance input uses `onChange={(e) => setEditValue(Number(e.target.value))}`.
If the user clears the field entirely, `Number("")` is `0` (acceptable). But `Number("abc")` is
`NaN`. Because the input has `type="number"` the browser prevents most non-numeric input on desktop,
but mobile browsers and accessibility tools may allow it. `editValue` would be `NaN`, and
`updateBalanceSchema` uses `z.number().int().min(0)` — `NaN` is technically a `number` in JS so
Zod's `.number()` check passes; `.int()` will reject it (NaN is not an integer), so the server
correctly returns a validation error. However, `updateBalance.onError` merely calls
`setEditingId(null)` (cancels editing) without showing a user-facing message about why the save
failed. The UX is confusing — the balance silently reverts.

**Fix:** Validate on commit:
```typescript
function commitEdit(userId: string) {
  if (editingId === null) return
  if (!Number.isInteger(editValue) || editValue < 0) {
    toast.error("Balance must be a whole number ≥ 0.")
    return
  }
  setEditingId(null)
  updateBalance.mutate({ userId, newBalance: editValue })
}
```

---

#### WR-03: `updateBalanceSchema.newBalance` allows fractional input via direct API call

**File:** `src/lib/validation/task.ts:25`

**Issue:** `updateBalanceSchema` uses `z.number().int()` but not `z.coerce.number()`. The tRPC wire
always delivers a number (superjson), so coercion is not the issue. The issue is that a decimal like
`10.0` is technically an integer in IEEE-754 and will pass `.int()`, but `10.5` will correctly fail.
This is fine at the Zod layer. However, the companion `createTaskSchema` uses `z.coerce.number()`
for `cpReward` (necessary because the form delivers strings), while `updateBalanceSchema` uses
`z.number()` (requires a true number). This inconsistency is a latent trap: if the balance input in
`AdminUserTable` is ever refactored to go through `react-hook-form` with a resolver and the resolver
receives a string from the DOM, validation will silently fail or behave differently from
`createTaskSchema`. Consider adding `z.coerce` to `updateBalanceSchema.newBalance` for consistency,
or leaving a prominent comment explaining why the omission is intentional.

**Fix:** Document explicitly or make consistent:
```typescript
// Either:
newBalance: z.coerce.number().int().min(0),
// Or add comment: newBalance uses z.number() (not coerce) because it is always submitted
// programmatically as a JS number, never from a form string.
```

---

#### WR-04: TASK-01 E2E test has a conditional task navigation that silently passes if the task is absent

**File:** `tests/e2e/admin-tasks.spec.ts:134-141`

**Issue:** The TASK-01 test conditionally clicks into a task detail:

```typescript
if (await taskCard.isVisible({ timeout: 5000 }).catch(() => false)) {
  // navigate and assert
}
```

If `TASK_TITLE` is not visible (e.g., ADMN-02 failed, or the task was not created), the entire
detail navigation block is skipped and the test still passes. TASK-01 is supposed to verify that
`/tasks/[id]` opens and shows the task. In serial mode ADMN-02 always runs first, but if ADMN-02
is isolated or rerun independently, TASK-01 will pass vacuously — it never navigates to any
`/tasks/[id]` URL, yet no assertion fails. This can mask real regressions in the detail page.

**Fix:** Make the assertion unconditional by using the task created in the previous test. Since
`TASK_TITLE` is module-level and the file is serial, ADMN-02 always runs before TASK-01. Assert
directly rather than guarding with `isVisible`:

```typescript
const taskCard = page.getByText(TASK_TITLE).first()
await expect(taskCard).toBeVisible({ timeout: 10000 })
const detailLink = page.locator(`a[href^="/tasks/"]`).first()
await detailLink.click()
await expect(page).toHaveURL(/\/tasks\//, { timeout: 10000 })
await expect(page.getByText(TASK_TITLE)).toBeVisible()
```

---

#### WR-05: Missing `@@index` on `Reply.taskId` — full table scan on every task thread load

**File:** `prisma/schema.prisma:159-177`

**Issue:** `getTaskReplies` filters with `where: { taskId: input.taskId }`. The `Reply` model has
no index on `taskId`. As the reply table grows (post replies + task replies sharing one table), this
query will scan every row. The `Post` relation has `@@index([createdAt])` on `Post`, but the `Reply`
table has no indexes at all — neither on `postId` nor on `taskId`. At MVP scale this may be
acceptable, but it is a correctness gap: the schema silently permits unbounded scan queries on a
core read path (reply thread loading).

**Fix:**
```prisma
model Reply {
  // ...
  @@index([taskId])
  @@index([postId])
  @@map("replies")
}
```

---

### INFO

---

#### IN-01: `formatRelativeTime` and `getMediaType` are duplicated across three files

**File:** `src/components/tasks/task-card.tsx:33-55`, `src/components/tasks/task-reply-card.tsx:28-55`, `src/components/post-card.tsx` (similar)

**Issue:** Both `formatRelativeTime` and `getMediaType` are copied verbatim into `task-card.tsx`
and `task-reply-card.tsx`, which also duplicate the same functions that exist in `post-card.tsx`.
The comment on both files says "copied verbatim from post-card.tsx — do not reimplement." Verbatim
copying is a maintenance risk: a bug fix in one copy will not propagate to the others. These are
pure utility functions with no React dependency.

**Fix:** Extract to `src/lib/format.ts` (or `src/lib/media.ts`) and import from all three components.

---

#### IN-02: `AvatarImage src={undefined}` hardcoded in AdminUserTable — image field not fetched

**File:** `src/components/admin/user-table.tsx:104`

**Issue:** `AvatarImage` is rendered with `src={undefined}` unconditionally, meaning the user's
profile image is never shown in the admin table even if the user has one. The `AdminUser` interface
does not include an `image` field, and the server-side select in `/admin/page.tsx` does not fetch
`image` either. This is a minor visual omission — the fallback UserCircle always renders — but it
means the admin table differs from every other user-display surface in the app (header, task cards,
reply cards all show `image`).

**Fix:** Add `image` to the select and interface:
```typescript
// page.tsx select:
image: true,
// AdminUser interface:
image: string | null
// user-table.tsx AvatarImage:
<AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
```

---

#### IN-03: `console.error` left in CreateTaskModal upload error handler

**File:** `src/components/tasks/create-task-modal.tsx:175`

**Issue:** `console.error("Upload failed:", err.message)` is a debug artifact. The `ReplyCompose`
component uses `toast.error(...)` for the same error path, which is the consistent pattern in this
codebase. The admin will see no visible feedback from this path.

**Fix:** Replace with a toast:
```typescript
onUploadError={(err) => {
  toast.error(`Upload failed: ${err.message}`)
}}
```
