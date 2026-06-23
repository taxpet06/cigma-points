"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import { AdminUserTable } from "@/components/admin/user-table"
import { TaskCard } from "@/components/tasks/task-card"
import { CreateTaskModal } from "@/components/tasks/create-task-modal"
import { FeedSkeleton } from "@/components/feed/feed-skeleton"

function AdminUsersPanel() {
  const trpc = useTRPC()
  const { data: users, isLoading } = useQuery(trpc.admin.getAllUsers.queryOptions())

  if (isLoading) return <FeedSkeleton count={3} />
  if (!users || users.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No users found.</p>
  }

  return <AdminUserTable users={users} />
}

function AdminTasksPanel() {
  const trpc = useTRPC()
  const { data: tasks, isLoading } = useQuery(trpc.task.getTasks.queryOptions())

  if (isLoading) return <FeedSkeleton count={3} />

  return (
    <div className="space-y-4">
      {!tasks || tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No tasks yet.</p>
      ) : (
        tasks.map((task) => (
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
        ))
      )}
    </div>
  )
}

export function AdminTabs() {
  const [tab, setTab] = useState<"users" | "tasks">("users")

  return (
    <>
      <div className="flex items-center border-b mt-8">
        {(["users", "tasks"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-base font-semibold capitalize transition-colors ${
              tab === t
                ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "users" && <AdminUsersPanel />}
        {tab === "tasks" && (
          <>
            <div className="flex justify-end mb-4">
              <CreateTaskModal />
            </div>
            <AdminTasksPanel />
          </>
        )}
      </div>
    </>
  )
}
