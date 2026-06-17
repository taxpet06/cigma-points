// PostCard — shared post card component built in Phase 2 for profile post history.
// Phase 3 inherits this component for the main feed (D-08 / Pattern 9 in RESEARCH.md).
//
// Phase 3 forward-compat optional props accepted now (not implemented):
//   mediaUrl, replyCount, agreeCount, disagreeCount
//
// Security: PostCard renders server-provided values only; no client mutation (T-02-07).

import {
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  CheckCircle2,
  XCircle,
  UserCircle,
} from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostCardProps {
  /** Primary fields from getPostHistory items */
  id: string
  type: "AWARD" | "DEDUCT" | "TASK"
  title: string
  cpAmount: number
  outcome: string | null
  settled: boolean
  votingEndsAt: Date
  createdAt: Date
  author: { id: string; name: string | null; image: string | null }
  targetUser: { id: string; name: string | null; image: string | null }
  voteCount: number // sourced from _count.votes

  // Phase 3 forward-compat optional props — accepted now, NOT implemented (D-08 / Pattern 9)
  mediaUrl?: string
  replyCount?: number
  agreeCount?: number
  disagreeCount?: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a relative time string like "3 minutes ago" using native Intl API.
 * No external date library required.
 */
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

/**
 * Formats a Date as a short locale date+time string for the voting deadline.
 */
function formatDeadline(date: Date): string {
  return date.toLocaleString("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PostCard({
  type,
  title,
  cpAmount,
  outcome,
  settled,
  votingEndsAt,
  createdAt,
  author,
  targetUser,
  voteCount,
  // Phase 3 forward-compat — accepted but not rendered yet
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mediaUrl: _mediaUrl,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  replyCount: _replyCount,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  agreeCount: _agreeCount,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  disagreeCount: _disagreeCount,
}: PostCardProps) {
  // --- Type badge ---
  const isAward = type === "AWARD"
  const isDeduct = type === "DEDUCT"

  const typeBadgeClasses = cn(
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
    {
      "text-emerald-600 bg-emerald-50": isAward,
      "text-red-600 bg-red-50": isDeduct,
      "text-muted-foreground bg-muted": !isAward && !isDeduct, // TASK type
    }
  )

  const TypeIcon =
    isAward ? ArrowUpCircle : isDeduct ? ArrowDownCircle : ArrowUpCircle
  const typeBadgeLabel = isAward ? "Award" : isDeduct ? "Deduct" : type
  const typeBadgeAriaLabel = isAward
    ? "Award post"
    : isDeduct
      ? "Deduct post"
      : "Task post"

  // --- Outcome badge ---
  let outcomeBadge: React.ReactNode
  if (!settled) {
    outcomeBadge = (
      <span className="inline-flex items-center gap-1 text-sm text-amber-600">
        <Clock className="h-4 w-4" />
        Pending
      </span>
    )
  // Canonical outcome values written by the settlement logic: "Awarded" | "Rejected"
  } else if (outcome === "Awarded") {
    outcomeBadge = (
      <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
        <CheckCircle2 className="h-4 w-4" />
        Awarded
      </span>
    )
  } else {
    outcomeBadge = (
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <XCircle className="h-4 w-4" />
        Rejected
      </span>
    )
  }

  // --- Avatar helpers ---
  const authorName = author.name ?? "Unknown"
  const targetName = targetUser.name ?? "Unknown"

  return (
    <Card>
      <CardHeader className="pb-3">
        {/* Row 1: type badge + CP amount + outcome badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={typeBadgeClasses}
            aria-label={typeBadgeAriaLabel}
          >
            <TypeIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {typeBadgeLabel}
          </span>
          <span className="text-sm font-semibold">
            {cpAmount > 0 ? "+" : ""}
            {cpAmount} CP
          </span>
          <span className="ml-auto">{outcomeBadge}</span>
        </div>

        {/* Row 2: author → target with avatars */}
        <div className="flex items-center gap-2 mt-1">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage
              src={author.image ?? undefined}
              alt={`${authorName}'s profile photo`}
            />
            <AvatarFallback>
              <UserCircle
                className="h-full w-full text-muted-foreground"
                aria-hidden="true"
              />
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{authorName}</span>
            {" → "}
            <span className="font-medium text-foreground">{targetName}</span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Post title */}
        <p className="text-base font-semibold">{title}</p>

        {/* Relative timestamp */}
        <p className="mt-1 text-sm text-muted-foreground">
          {formatRelativeTime(createdAt)}
        </p>
      </CardContent>

      <CardFooter className="border-t pt-3">
        <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
          <span>{voteCount} {voteCount === 1 ? "vote" : "votes"}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            Voting ends {formatDeadline(votingEndsAt)}
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}
