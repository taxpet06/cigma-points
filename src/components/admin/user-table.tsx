"use client"

// AdminUserTable — displays all users with their CP balances.
// CP Balance cell supports inline editing: click → input, Enter/blur → save, Escape → cancel.
// Pattern: RESEARCH Pattern 4 (controlled input + editingId/editValue state).
//
// Security: admin.updateBalance is FORBIDDEN-guarded server-side (Plan 06-01).
//           Explicit select in /admin page.tsx excludes password (T-6-09 mitigated).
// Accessibility: table role="table", th scope="col", aria-label on inline input (UI-SPEC contract).

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, UserCircle } from "lucide-react"
import { toast } from "sonner"
import { useTRPC } from "@/trpc/client"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminUser {
  id: string
  name: string | null
  email: string | null
  username: string | null
  cigmaPoints: number
  role: "USER" | "ADMIN"
  createdAt: Date
}

interface AdminUserTableProps {
  users: AdminUser[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminUserTable({ users }: AdminUserTableProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // Inline edit state — one row at a time
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)

  const updateBalance = useMutation(
    trpc.admin.updateBalance.mutationOptions({
      onSuccess: () => {
        toast.success("Balance updated")
        void queryClient.invalidateQueries(trpc.admin.getAllUsers.queryFilter())
      },
      onError: () => {
        toast.error("Failed to update balance. Try again.")
        setEditingId(null)
      },
    })
  )

  // Inline edit helpers (Pattern 4)
  function startEdit(userId: string, currentBalance: number) {
    setEditingId(userId)
    setEditValue(currentBalance)
  }

  function commitEdit(userId: string) {
    updateBalance.mutate({ userId, newBalance: editValue })
    setEditingId(null)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table role="table" className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th scope="col" className="py-3 px-4 text-left text-sm font-semibold text-muted-foreground w-10">
              {/* Avatar column — no label */}
            </th>
            <th scope="col" className="py-3 px-4 text-left text-sm font-semibold">Name</th>
            <th scope="col" className="py-3 px-4 text-left text-sm font-semibold">Email</th>
            <th scope="col" className="py-3 px-4 text-left text-sm font-semibold">Username</th>
            <th scope="col" className="py-3 px-4 text-left text-sm font-semibold">CP Balance</th>
            <th scope="col" className="py-3 px-4 text-left text-sm font-semibold">Role</th>
            <th scope="col" className="py-3 px-4 text-left text-sm font-semibold">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-muted/20 transition-colors">
              {/* Avatar column */}
              <td className="py-3 px-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={undefined} alt={user.name ?? "User"} />
                  <AvatarFallback>
                    {/* D-11: UserCircle fallback — NO initials */}
                    <UserCircle className="h-full w-full text-muted-foreground" aria-hidden="true" />
                  </AvatarFallback>
                </Avatar>
              </td>

              {/* Name */}
              <td className="py-3 px-4 font-medium">
                {user.name ?? <span className="text-muted-foreground italic">—</span>}
              </td>

              {/* Email */}
              <td className="py-3 px-4 text-muted-foreground">
                {user.email ?? "—"}
              </td>

              {/* Username */}
              <td className="py-3 px-4 text-muted-foreground">
                {user.username ? `@${user.username}` : <span className="italic">—</span>}
              </td>

              {/* CP Balance — inline editable cell (D-04) */}
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  {editingId === user.id ? (
                    <>
                      <input
                        type="number"
                        className="w-20 h-8 text-sm border rounded px-2 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                        aria-label={`Edit CP balance for ${user.name ?? user.email}`}
                        value={editValue}
                        onChange={(e) => setEditValue(Number(e.target.value))}
                        onBlur={() => commitEdit(user.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit(user.id)
                          if (e.key === "Escape") cancelEdit()
                        }}
                        autoFocus
                      />
                      {updateBalance.isPending && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" aria-hidden="true" />
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      className="tabular-nums font-semibold hover:text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-zinc-400 rounded px-1 -mx-1"
                      onClick={() => startEdit(user.id, user.cigmaPoints)}
                      title="Click to edit CP balance"
                    >
                      {user.cigmaPoints}
                    </button>
                  )}
                </div>
              </td>

              {/* Role pill */}
              <td className="py-3 px-4">
                {user.role === "ADMIN" ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-primary bg-secondary">
                    Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-muted-foreground bg-muted">
                    User
                  </span>
                )}
              </td>

              {/* Joined date */}
              <td className="py-3 px-4 text-muted-foreground text-xs">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
