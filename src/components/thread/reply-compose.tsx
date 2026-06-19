"use client"

// ReplyCompose — pinned compose box on /post/[id] detail page.
// Always visible; shows a dismissible "Replying to @username" banner when parentId is set.
// Media upload reuses postMediaUploader endpoint — no new FileRouter route needed (D-08).
//
// State: controlled from parent (ThreadSection) — parentId/replyingToUsername/onClearParent are props.
// Mutation: NON-OPTIMISTIC (D-10) — waits for server confirmation then invalidates both reply + feed queries.
//
// Security: T-05-10 — createReply is protectedProcedure with authorId from session (Plan 05-01).
//           T-05-09 — orphaned media on failed submit accepted at MVP scale (RESEARCH security domain).

import { useState, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { useTRPC } from "@/trpc/client"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { UploadButton } from "@/lib/uploadthing"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReplyComposeProps {
  postId: string
  parentId: string | null
  replyingToUsername: string | null
  onClearParent: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReplyCompose({
  postId,
  parentId,
  replyingToUsername,
  onClearParent,
}: ReplyComposeProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [content, setContent] = useState("")
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // NON-OPTIMISTIC mutation (D-10) — no onMutate, waits for server confirmation
  const createReply = useMutation(
    trpc.reply.createReply.mutationOptions({
      onSuccess: () => {
        setContent("")
        setMediaUrl(undefined)
        onClearParent()
        void queryClient.invalidateQueries(trpc.reply.getReplies.queryFilter({ postId }))
        void queryClient.invalidateQueries(trpc.post.getFeed.queryFilter())
      },
      onError: () => {
        toast.error("Failed to post reply. Try again.")
      },
    })
  )

  function handleSubmit() {
    if (content.trim().length === 0) return
    createReply.mutate({
      postId,
      parentId: parentId ?? undefined,
      content: content.trim(),
      mediaUrl,
    })
  }

  return (
    <div id="reply-compose" className="rounded-lg border bg-card p-4 space-y-3">
      {/* "Replying to @username" banner (conditional) */}
      {replyingToUsername && (
        <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <span>Replying to @{replyingToUsername}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            aria-label={`Cancel replying to ${replyingToUsername}`}
            onClick={onClearParent}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Visually hidden label for accessibility */}
      <label htmlFor="reply-compose-textarea" className="sr-only">
        Reply
      </label>

      <Textarea
        id="reply-compose-textarea"
        ref={textareaRef}
        placeholder="Write a reply…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        className="resize-none"
      />

      <div className="flex items-center justify-between gap-2">
        {/* Media upload / attached indicator */}
        <div className="flex items-center gap-2">
          {mediaUrl ? (
            <div className="flex items-center gap-2 text-sm">
              <span>Media attached</span>
              <button
                type="button"
                className="text-destructive hover:underline"
                onClick={() => setMediaUrl(undefined)}
              >
                Remove
              </button>
            </div>
          ) : (
            <UploadButton
              endpoint="postMediaUploader"
              config={{ cn }}
              onClientUploadComplete={(res) => {
                const url = res[0]?.url
                if (url) setMediaUrl(url)
              }}
              onUploadError={(err) => {
                toast.error(`Upload failed: ${err.message}`)
              }}
            />
          )}
        </div>

        {/* Submit button */}
        <Button
          variant="default"
          disabled={content.trim().length === 0 || createReply.isPending}
          aria-busy={createReply.isPending}
          onClick={handleSubmit}
        >
          {createReply.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting…
            </>
          ) : (
            "Post Reply"
          )}
        </Button>
      </div>
    </div>
  )
}
