// /tasks/[id] — Task detail page (server component).
// Mirrors /post/[id]/page.tsx — TaskCard at top + TaskThreadSection for replies.
//
// Security:
//   T-6-14 — requireSession() enforces authentication before any DB access.
//   T-6-15 — explicit select excludes password/email; admin limited to id/name/image.
//
// Next.js 15: params is a Promise — must await (PATTERNS.md async params pattern).
//
// TASK-02: /tasks/[id] shows task + threaded replies; users can reply and nest (D-09).

import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth-helpers"
import { TaskCard } from "@/components/tasks/task-card"
import { TaskThreadSection } from "@/components/tasks/task-thread-section"

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params // REQUIRED in Next.js 15 — params is a Promise

  await requireSession() // T-6-14: authenticated users only

  // T-6-15: explicit select — never select password or email
  const task = await db.task.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      cpReward: true,
      mediaUrl: true,
      createdAt: true,
      admin: { select: { id: true, name: true, image: true } }, // no password
    },
  })

  // Unknown/invalid task id → 404
  if (!task) notFound()

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      {/* Back link — exact copy from UI-SPEC copywriting contract */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </Link>

      {/* Task card (read-only — no vote buttons on tasks) */}
      <TaskCard
        id={task.id}
        title={task.title}
        description={task.description}
        cpReward={task.cpReward}
        mediaUrl={task.mediaUrl}
        createdAt={task.createdAt}
        admin={task.admin}
        replyCount={undefined}
      />

      {/* Interactive thread: compose + task replies (client boundary) */}
      <div className="mt-4">
        <TaskThreadSection taskId={task.id} />
      </div>
    </main>
  )
}
