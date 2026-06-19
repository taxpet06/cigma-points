---
phase: 06-admin-panel-tasks
plan: 02
subsystem: frontend
tags: [admin, trpc, shadcn, dialog, form, react-hook-form, inline-edit, nav]
dependency_graph:
  requires:
    - trpc.admin.getAllUsers (Plan 06-01)
    - trpc.admin.updateBalance (Plan 06-01)
    - trpc.task.createTask (Plan 06-01)
    - trpc.task.getTasks (Plan 06-01)
    - createTaskSchema (Plan 06-01)
  provides:
    - AdminUserTable (inline CP balance edit)
    - /admin page (server-side user fetch + AdminUserTable + CreateTaskModal)
    - CreateTaskModal (dialog form for task creation)
    - Tasks nav link in header (all authenticated users)
  affects:
    - src/components/nav/header.tsx (Tasks link added)
    - src/app/admin/page.tsx (placeholder replaced with real admin UI)
tech_stack:
  added: []
  patterns:
    - Server Component direct db.user.findMany with explicit select (no tRPC round-trip)
    - Inline cell edit via editingId/editValue state + commitEdit/cancelEdit (Pattern 4)
    - useMutation mutationOptions with onSuccess/onError + queryClient.invalidateQueries
    - Dialog + useForm + zodResolver + UploadButton (exact CreatePostModal structure)
    - Tasks nav link visible to all authenticated users (not gated by isAdmin)
key_files:
  created:
    - src/components/admin/user-table.tsx
    - src/components/tasks/create-task-modal.tsx
  modified:
    - src/app/admin/page.tsx
    - src/components/nav/header.tsx
decisions:
  - "Admin page fetches users server-side via db.user.findMany (not tRPC) for SSR efficiency"
  - "AdminUserTable explicit select excludes password (T-6-09); select is in Server Component, not client"
  - "Tasks link placed before Admin link in header, outside isAdmin guard per D-07"
  - "CreateTaskModal cancel button uses Discard Changes copy per UI-SPEC copywriting contract"
metrics:
  duration: "4 minutes"
  completed: "2026-06-19"
  tasks_completed: 2
  files_changed: 4
---

# Phase 06 Plan 02: Admin Dashboard + Tasks Nav Summary

Admin vertical slice complete. /admin page with server-side user table and inline CP balance editing (ADMN-01), CreateTaskModal for task post creation (ADMN-02), and Tasks nav link for all authenticated users (D-07).

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | AdminUserTable + /admin page | fbe137b | src/components/admin/user-table.tsx, src/app/admin/page.tsx |
| 2 | CreateTaskModal + Tasks nav link | 0bc28b8 | src/components/tasks/create-task-modal.tsx, src/components/nav/header.tsx |

## Must-Have Truth Verification

- **Admin visiting /admin sees a table of all users with their CP balances:** Server Component fetches via `db.user.findMany` with explicit select; `AdminUserTable` renders table with all columns including CP Balance
- **Balance cell becomes a number input on click; pressing Enter/blur saves via updateBalance (D-04):** `startEdit/commitEdit/cancelEdit` pattern; `onBlur={() => commitEdit(user.id)}`; `onKeyDown` handles Enter/Escape; `admin.updateBalance.mutationOptions` wired with toast feedback
- **Admin can open a Create Task modal, fill title/description/cpReward, submit, and the task is created:** `CreateTaskModal` Dialog with `createTaskSchema` zodResolver; `task.createTask.mutationOptions`; `getTasks.queryFilter` invalidation on success
- **Header contains a /tasks nav link visible to all authenticated users (D-07):** Link inserted between CP badge and Admin link; NOT inside `isAdmin &&` block; verified at lines 65-72 of header.tsx

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data flows are wired. `AdminUserTable` receives `users` from server-side fetch. `CreateTaskModal` calls `task.createTask` with real tRPC mutation.

## Threat Flags

No new threat surface introduced beyond what the plan's threat model anticipated:
- T-6-08: requireAdmin() present in /admin page.tsx (dual gate with middleware)
- T-6-09: Explicit select excludes password — verified `grep -A10 "findMany" src/app/admin/page.tsx | grep "password"` returns only the comment, not a field in the select object
- T-6-11: postMediaUploader reused — existing auth gate preserved

## Self-Check: PASSED

Files exist:
- `src/components/admin/user-table.tsx` — FOUND
- `src/components/tasks/create-task-modal.tsx` — FOUND
- `src/app/admin/page.tsx` — FOUND (modified)
- `src/components/nav/header.tsx` — FOUND (modified)

Commits exist:
- fbe137b — FOUND (`git log --oneline | grep fbe137b`)
- 0bc28b8 — FOUND (`git log --oneline | grep 0bc28b8`)

TypeScript: zero errors outside admin-tasks.spec and .next/ folder.
