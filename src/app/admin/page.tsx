// Admin Dashboard — real admin panel (Phase 6).
//
// The real access gate is middleware.ts (T-01-06 / edge enforcement).
// requireAdmin() provides server-side defense-in-depth (Pitfall 4 / ASVS V4 / T-6-08).
//
// Security (T-6-09 Information Disclosure): db.user.findMany uses explicit select
// that NEVER includes password, accounts, or sessions fields.
// Server Component fetches users directly — avoids tRPC round-trip for initial render.

import { requireAdmin } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { AdminUserTable } from "@/components/admin/user-table"
import { CreateTaskModal } from "@/components/tasks/create-task-modal"

export default async function AdminPage() {
  // Server-side re-check (Pitfall 4 / T-01-06 / T-6-08 dual enforcement).
  // Middleware catches 99% of unauthorized attempts; this line is the final backstop.
  await requireAdmin()

  // T-6-09 explicit select — password and auth relations excluded
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      cigmaPoints: true,
      role: true,
      createdAt: true,
      // password: never included (Information Disclosure T-6-09)
    },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Admin Dashboard
        </h1>
        <CreateTaskModal />
      </div>

      <section>
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-zinc-900 dark:text-zinc-50">
          Users
        </h2>
        <AdminUserTable users={users} />
      </section>
    </div>
  )
}
