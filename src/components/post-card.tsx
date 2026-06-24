"use client"

import Link from "next/link"
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from "lucide-react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { cn, formatRelativeTime } from "@/lib/utils"
import { VoteButtons } from "@/components/feed/vote-buttons"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostCardProps {
  id: string
  type: "AWARD" | "DEDUCT"
  title: string
  cpAmount: number
  outcome: string | null
  settled: boolean
  votingEndsAt: Date
  createdAt: Date
  explanation?: string | null
  author: { id: string; name: string | null; image: string | null }
  targetUser: { id: string; name: string | null; image: string | null }

  // Vote display
  agreeCount?: number
  disagreeCount?: number
  userVote?: { type: "AGREE" | "DISAGREE" } | null

  // Vote interaction (provided by FeedList; absent on profile/history views)
  currentUserId?: string | undefined
  onVote?: (type: "AGREE" | "DISAGREE") => void
  onRetract?: () => void
  isPending?: boolean

  // Other optional props
  mediaUrl?: string
  replyCount?: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PostCard({
  id,
  type,
  title,
  cpAmount,
  outcome,
  settled,
  votingEndsAt,
  createdAt,
  explanation,
  author,
  targetUser,
  agreeCount,
  disagreeCount,
  userVote,
  currentUserId,
  onVote,
  onRetract,
  isPending,
  mediaUrl,
  replyCount,
}: PostCardProps) {
  const isAward = type === "AWARD"
  const isDeduct = type === "DEDUCT"

  const typeBadgeClasses = cn(
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
    {
      "text-emerald-600 bg-emerald-50": isAward,
      "text-red-600 bg-red-50": isDeduct,
      "text-muted-foreground bg-muted": !isAward && !isDeduct,
    }
  )

  const TypeIcon = isAward ? ArrowUpCircle : isDeduct ? ArrowDownCircle : ArrowUpCircle
  const typeBadgeLabel = isAward ? "Award" : isDeduct ? "Deduct" : type
  const typeBadgeAriaLabel = isAward ? "Award post" : isDeduct ? "Deduct post" : "Task post"

  let outcomeBadge: React.ReactNode
  if (!settled) {
    outcomeBadge = (
      <span className="inline-flex items-center gap-1 text-sm text-amber-600">
        <Clock className="h-4 w-4" />
        Pending
      </span>
    )
  } else if (outcome === "Awarded") {
    outcomeBadge = (
      <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
        <CheckCircle2 className="h-4 w-4" />
        Awarded
      </span>
    )
  } else if (outcome === "Rejected") {
    outcomeBadge = (
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <XCircle className="h-4 w-4" />
        Rejected
      </span>
    )
  } else if (settled) {
    outcomeBadge = (
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4" />
        Settled
      </span>
    )
  } else {
    outcomeBadge = null
  }

  const authorName = author.name ?? "Unknown"
  const targetName = targetUser.name ?? "Unknown"

  // Vote buttons are shown only when interaction props are provided (feed view)
  const canShowVoteButtons = !!onVote && !!onRetract
  const isVotingOpen =
    canShowVoteButtons &&
    !settled &&
    !!votingEndsAt &&
    new Date() < new Date(votingEndsAt) &&
    currentUserId !== author.id

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={typeBadgeClasses} aria-label={typeBadgeAriaLabel}>
            <TypeIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {typeBadgeLabel}
          </span>
          <span className="text-sm font-semibold font-mono tabular-nums">
            {cpAmount > 0 ? "+" : ""}
            {cpAmount} CP
          </span>
          <span className="ml-auto">{outcomeBadge}</span>
        </div>

        <div className="flex items-center gap-2 mt-1 min-w-0">
          <span className="text-sm text-muted-foreground break-words min-w-0">
            <span className="font-medium text-foreground">{authorName}</span>
            {" → "}
            <span className="font-medium text-foreground">{targetName}</span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-base font-semibold break-words">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{formatRelativeTime(createdAt)}</p>
        {explanation && (
          <p className="mt-2 text-sm text-muted-foreground break-words text-pretty">{explanation}</p>
        )}

      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t pt-2">
        {canShowVoteButtons && (
          <VoteButtons
            agreeCount={agreeCount ?? 0}
            disagreeCount={disagreeCount ?? 0}
            userVote={userVote ?? null}
            isVotingOpen={isVotingOpen}
            isPending={isPending ?? false}
            onVote={onVote}
            onRetract={onRetract}
          />
        )}
        {!settled && votingEndsAt && (
          <div className="flex w-full items-center justify-end text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            Voting ends {new Date(votingEndsAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
        )}
        {typeof replyCount === "number" && (
          <div className="flex w-full items-center">
            <Link
              href={`/post/${id}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors min-h-[44px]",
                replyCount > 0
                  ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              {replyCount === 0
                ? "Reply"
                : `${replyCount} ${replyCount === 1 ? "Reply" : "Replies"}`}
            </Link>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
