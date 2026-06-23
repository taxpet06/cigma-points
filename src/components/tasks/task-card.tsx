"use client"

// TaskCard — displays a single Task Post in the /tasks list or /tasks/[id] page.
// No voting UI (tasks are not voteable — D-08).
// Shows cpReward badge, "Task" label, admin avatar/name, reply count link → /tasks/[id].
//
// Security: T-6-15 — explicit select in parent (admin limited to id/name/image; no password/email).

import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TaskCardProps {
  id: string
  title: string
  description: string
  cpReward: number | null
  mediaUrl?: string | null
  createdAt: Date
  admin: { id: string; name: string | null; image: string | null }
  replyCount?: number
}

// ---------------------------------------------------------------------------
// Helpers (copied verbatim from post-card.tsx — do not reimplement)
// ---------------------------------------------------------------------------

function formatRelativeTime(date: Date): string {
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffSeconds = Math.round(diffMs / 1000)
  const diffMinutes = Math.round(diffSeconds / 60)
  const diffHours = Math.round(diffMinutes / 60)
  const diffDays = Math.round(diffHours / 24)

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

  if (Math.abs(diffSeconds) < 60) return rtf.format(-diffSeconds, "second")
  if (Math.abs(diffMinutes) < 60) return rtf.format(-diffMinutes, "minute")
  if (Math.abs(diffHours) < 24) return rtf.format(-diffHours, "hour")
  return rtf.format(-diffDays, "day")
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TaskCard({
  id,
  title,
  description,
  cpReward,
  mediaUrl,
  createdAt,
  admin,
  replyCount,
}: TaskCardProps) {
  const adminName = admin.name ?? "Admin"

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* "Task" label badge — muted, no icon (D-08: no vote UI) */}
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-muted-foreground bg-muted">
            Task
          </span>

          {/* CP reward badge — emerald (UI-SPEC color contract) */}
          {cpReward != null && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 ml-auto">
              {cpReward} CP
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{adminName}</span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Title — text-base font-semibold per UI-SPEC typography contract */}
        <p className="text-base font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{formatRelativeTime(createdAt)}</p>

        {/* Description */}
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t pt-2">
        {/* Reply count link → /tasks/[id] using MessageSquare (UI-SPEC copywriting contract) */}
        <div className="flex w-full items-center">
          <Link
            href={`/tasks/${id}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            {replyCount == null || replyCount === 0
              ? "Reply"
              : replyCount === 1
              ? "1 Reply"
              : `${replyCount} Replies`}
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
