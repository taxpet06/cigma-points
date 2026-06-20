// /tasks — Task list page (server component).
//
// Security:
//   T-6-14 — requireSession() enforces authentication; unauthenticated users are redirected.
//   T-6-15 — explicit select excludes password/email; admin limited to id/name/image.
//
// TASK-01: dedicated /tasks route lists task posts for all authenticated users.

import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth-helpers"
import { TaskCard } from "@/components/tasks/task-card"

export default async function TasksPage() {
  await requireSession() // TASK-01: authenticated users only (T-6-14)

  const tasks = await db.task.findMany({
    orderBy: { createdAt: "desc" }, // newest first — same as feed
    select: {
      id: true,
      title: true,
      description: true,
      cpReward: true,
      mediaUrl: true,
      createdAt: true,
      admin: { select: { id: true, name: true, image: true } }, // T-6-15: no password
      _count: { select: { replies: true } },
    },
  })

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Tasks</h1>

      {tasks.length === 0 ? (
        /* Empty state — exact copy from UI-SPEC copywriting contract */
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-sm font-medium">No tasks yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back later for tasks you can complete to earn CP.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              id={task.id}
              title={task.title}
              description={task.description}
              cpReward={task.cpReward}
              mediaUrl={task.mediaUrl}
              createdAt={task.createdAt}
              admin={task.admin}
              replyCount={task._count.replies}
            />
          ))}
        </div>
      )}
    </main>
  )
}
