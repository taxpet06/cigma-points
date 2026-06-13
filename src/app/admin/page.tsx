// Admin Dashboard placeholder page — AUTH-04.
//
// The real access gate is middleware.ts (T-01-06 / edge enforcement).
// requireAdmin() provides server-side defense-in-depth (Pitfall 4 / ASVS V4).
// Real admin features (user management, task posts) land in Phase 6.

import { requireAdmin } from "@/lib/auth-helpers"

export default async function AdminPage() {
  // Server-side re-check (Pitfall 4 / T-01-06 dual enforcement).
  // Middleware catches 99% of unauthorized attempts; this line is the final backstop.
  await requireAdmin()

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Admin Dashboard
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Admin features are coming in Phase 6. This placeholder confirms the admin route gate is working.
      </p>
    </div>
  )
}
