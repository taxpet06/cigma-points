---
phase: 06-admin-panel-tasks
plan: 03
subsystem: frontend
tags: [tasks, trpc, shadcn, thread, reply, server-component, admin]
dependency_graph:
  requires:
    - trpc.task.getTasks (Plan 06-01)
    - trpc.task.getTask (Plan 06-01)
    - trpc.task.getTaskReplies (Plan 06-01)
    - trpc.task.completeTask (Plan 06-01)
    - trpc.reply.createReply with taskId (Plan 06-01)
  provides:
    - /tasks page (authenticated task list, Server Component)
    - /tasks/[id] page (task detail + threaded replies, Server Component)
    - TaskCard (no voting UI, cpReward badge, reply count link)
    - TaskReplyCard (status badge + admin Mark Complete)
    - TaskReplyThread (getTaskReplies + buildTree)
    - TaskThreadSection (lifted state + ReplyCompose taskId wiring)
    - ReplyCompose extended with optional taskId (Phase 5 post path unchanged)
  affects:
    - src/components/thread/reply-compose.tsx (postId made optional, taskId added)
tech_stack:
  added: []
  patterns:
    - Optional postId/taskId props with branched invalidation in ReplyCompose
    - TaskReplyNode type extends ReplyNode with taskId + author.taskCompletions
    - buildTree copied verbatim from reply-thread.tsx (generic over id/parentId/children)
    - useSession() role check for admin-only Mark Complete UI gate (paired with server FORBIDDEN)
    - Non-optimistic mutation + toast feedback pattern (Phase 5 carry-forward)
    - Server Component direct db.task query with explicit select (no tRPC round-trip)
key_files:
  created:
    - src/components/tasks/task-card.tsx
    - src/components/tasks/task-thread.tsx
    - src/components/tasks/task-reply-card.tsx
    - src/components/tasks/task-thread-section.tsx
    - src/app/tasks/page.tsx
    - src/app/tasks/[id]/page.tsx
  modified:
    - src/components/thread/reply-compose.tsx
decisions:
  - "postId made optional in ReplyCompose (not removed) so Phase 5 ThreadSection still works without changes"
  - "TaskReplyNode defined in task-thread.tsx and imported by task-reply-card.tsx (avoids circular import)"
  - "Mark Complete button uses variant=default per UI-SPEC accent contract (visually distinct from ghost Reply)"
  - "Empty state on /tasks renders when tasks.length === 0 with exact UI-SPEC copywriting contract"
metrics:
  duration: "7 minutes"
  completed: "2026-06-19"
  tasks_completed: 2
  files_changed: 7
---

# Phase 06 Plan 03: Tasks Consumption Vertical Slice Summary

Tasks consumption vertical slice complete. /tasks list (TASK-01), /tasks/[id] with threaded replies (TASK-02), Pending/Awarded status badges (TASK-03), admin Mark Complete action with CP award (ADMN-03). ReplyCompose extended with optional taskId; Phase 5 post reply path unchanged.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | ReplyCompose taskId + TaskCard + /tasks page | 8618ca3 | reply-compose.tsx, task-card.tsx, tasks/page.tsx |
| 2 | TaskReplyCard + task-thread + task-thread-section + /tasks/[id] | b3930e9 | task-reply-card.tsx, task-thread.tsx, task-thread-section.tsx, tasks/[id]/page.tsx |

## Must-Have Truth Verification

- **Any authenticated user can visit /tasks and see task cards newest-first:** `requireSession()` at top of /tasks Server Component; `findMany orderBy { createdAt: "desc" }`; empty state "No tasks yet." with exact UI-SPEC copy
- **TaskCard has no vote UI — cpReward badge + reply count only:** No VoteButtons import; emerald `{N} CP` badge; MessageSquare link to /tasks/[id]; "Task" label badge; admin avatar/name only (no arrow → target)
- **Clicking a task card opens /tasks/[id] with TaskCard + reply thread:** Link in TaskCard footer → `/tasks/${id}`; /tasks/[id] page renders TaskCard + TaskThreadSection
- **User can post a reply and it appears in the thread:** ReplyCompose wired with taskId; onSuccess invalidates `getTaskReplies`; TaskReplyThread refetches and renders updated tree
- **User can reply to a reply (nested, Twitter-style):** TaskReplyCard has Reply button that calls onReply; handleReply in TaskThreadSection lifts parentId → ReplyCompose shows "Replying to @username" banner; createReply accepts parentId
- **Each task reply shows Pending or Awarded status visible to all:** `completion = reply.author.taskCompletions[0]`; Awarded → emerald CheckCircle2 badge; Pending → amber Clock badge; no auth gate on badge render
- **Mark Complete admin-only + hidden when AWARDED:** `isAdmin && !isAwarded` guard; server also enforces FORBIDDEN (dual gate T-6-12); toast "CP awarded" on success

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data flows are wired. TaskCard receives task data from server-side `db.task.findMany`. TaskReplyThread calls `trpc.task.getTaskReplies` with real data. Mark Complete calls `trpc.task.completeTask` which runs a real $transaction.

## Threat Flags

No new threat surface introduced beyond what the plan's threat model anticipated:
- T-6-12: UI gate `isAdmin && !isAwarded` present in task-reply-card.tsx; server FORBIDDEN guard is in Plan 06-01 task.ts
- T-6-13: No dangerouslySetInnerHTML in any new component (React escapes all text)
- T-6-14: requireSession() in both /tasks and /tasks/[id] Server Components; getTaskReplies is protectedProcedure
- T-6-15: Explicit select on all db queries; admin limited to id/name/image; no password/email in selects
- T-6-16: ReplyCompose sends exactly one of postId/taskId (branched handleSubmit); server XOR refine in createReplySchema

## Self-Check: PASSED

Files exist:
- `src/components/tasks/task-card.tsx` — FOUND
- `src/components/tasks/task-thread.tsx` — FOUND
- `src/components/tasks/task-reply-card.tsx` — FOUND
- `src/components/tasks/task-thread-section.tsx` — FOUND
- `src/app/tasks/page.tsx` — FOUND
- `src/app/tasks/[id]/page.tsx` — FOUND
- `src/components/thread/reply-compose.tsx` — FOUND (modified)

Commits exist:
- 8618ca3 — feat(06-03): ReplyCompose taskId extension + TaskCard + /tasks list page
- b3930e9 — feat(06-03): TaskReplyCard + task-thread + task-thread-section + /tasks/[id] page

TypeScript: zero errors outside admin-tasks.spec and .next/ folder.
