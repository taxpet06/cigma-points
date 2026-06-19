"use client"

// ReplyCard — single reply card with avatar/name/timestamp/content/media + Reply button.
// Renders recursively with depth-capped visual indentation (max 4 levels).
//
// Security: T-05-08 — React escapes text content by default; no dangerouslySetInnerHTML used.

import { UserCircle, Reply } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ReplyNode } from "@/components/thread/reply-thread"

// ---------------------------------------------------------------------------
// Helpers (copied from post-card.tsx — do not reimplement)
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

function getMediaType(url: string): "image" | "video" {
  const lower = url.toLowerCase().split("?")[0]
  if (
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".avi")
  ) {
    return "video"
  }
  return "image"
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_VISUAL_DEPTH = 4

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ReplyCardProps {
  reply: ReplyNode
  depth: number
  onReply: (authorUsername: string, replyId: string) => void
}

export function ReplyCard({ reply, depth, onReply }: ReplyCardProps) {
  const displayName = reply.author.name ?? reply.author.username ?? "Unknown"

  return (
    <div>
      <Card className="mb-2">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage
                src={reply.author.image ?? undefined}
                alt={`${displayName}'s avatar`}
              />
              <AvatarFallback>
                <UserCircle className="h-full w-full text-muted-foreground" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{displayName}</span>
            {reply.author.username && (
              <span className="text-xs text-muted-foreground">@{reply.author.username}</span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {formatRelativeTime(reply.createdAt)}
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-2">
          <p className="text-sm">{reply.content}</p>

          {reply.mediaUrl && (
            <div className="mt-2 rounded-md overflow-hidden">
              {getMediaType(reply.mediaUrl) === "video" ? (
                <video
                  src={reply.mediaUrl}
                  controls
                  className="w-full max-h-48 object-cover"
                  aria-label="Reply video"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={reply.mediaUrl}
                  alt="Reply media"
                  className="w-full max-h-48 object-cover"
                />
              )}
            </div>
          )}

          <div className="flex justify-end mt-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Reply to ${reply.author.name ?? reply.author.username ?? "user"}`}
              onClick={() =>
                onReply(reply.author.username ?? reply.author.name ?? "user", reply.id)
              }
            >
              <Reply className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
              Reply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recursive children — children array is always [] (never undefined), safe to map */}
      {reply.children.length > 0 && (
        <div
          className={cn(
            "pl-4 border-l border-border",
            depth >= MAX_VISUAL_DEPTH && "pl-0"
          )}
        >
          {reply.children.map((child) => (
            <ReplyCard
              key={child.id}
              reply={child}
              depth={depth + 1}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}
