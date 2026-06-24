"use client"

import { ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VoteButtonsProps {
  agreeCount: number
  disagreeCount: number
  userVote: { type: "AGREE" | "DISAGREE" } | null
  isVotingOpen: boolean
  isPending: boolean
  onVote: (type: "AGREE" | "DISAGREE") => void
  onRetract: () => void
}

export function VoteButtons({
  agreeCount,
  disagreeCount,
  userVote,
  isVotingOpen,
  isPending,
  onVote,
  onRetract,
}: VoteButtonsProps) {
  const userVoteType = userVote?.type ?? null

  if (!isVotingOpen) {
    return (
      <div className="flex w-full items-center justify-between">
        <span className="text-sm text-muted-foreground tabular-nums">
          Agree: {agreeCount.toLocaleString()}&nbsp;&nbsp;Disagree: {disagreeCount.toLocaleString()}
        </span>
      </div>
    )
  }

  return (
    <div className="flex w-full items-center gap-2">
      <Button
        variant={userVoteType === "AGREE" ? "default" : "outline"}
        size="default"
        className="flex-1"
        disabled={isPending}
        aria-pressed={userVoteType === "AGREE"}
        aria-label={`Agree (${agreeCount} votes)`}
        onClick={() => userVoteType === "AGREE" ? onRetract() : onVote("AGREE")}
      >
        <ThumbsUp className="h-4 w-4 mr-1" aria-hidden="true" /> Agree ({agreeCount.toLocaleString()})
      </Button>
      <Button
        variant={userVoteType === "DISAGREE" ? "destructive" : "outline"}
        size="default"
        className="flex-1"
        disabled={isPending}
        aria-pressed={userVoteType === "DISAGREE"}
        aria-label={`Disagree (${disagreeCount} votes)`}
        onClick={() => userVoteType === "DISAGREE" ? onRetract() : onVote("DISAGREE")}
      >
        <ThumbsDown className="h-4 w-4 mr-1" aria-hidden="true" /> Disagree ({disagreeCount.toLocaleString()})
      </Button>
    </div>
  )
}
