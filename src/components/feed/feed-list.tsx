"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { useTRPC } from "@/trpc/client"
import { PostCard } from "@/components/post-card"
import { FeedSkeleton } from "@/components/feed/feed-skeleton"
import { FeedEmptyState } from "@/components/feed/feed-empty-state"

export function FeedList() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    ...trpc.post.getFeed.infiniteQueryOptions(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    ),
  })

  const castVoteMutation = useMutation(
    trpc.post.castVote.mutationOptions({
      onMutate: async ({ postId, type }) => {
        setPendingIds((prev) => new Set(prev).add(postId))
        await queryClient.cancelQueries(trpc.post.getFeed.infiniteQueryFilter({ limit: 20 }))
        const snapshot = queryClient.getQueriesData(trpc.post.getFeed.infiniteQueryFilter({ limit: 20 }))
        queryClient.setQueriesData(
          trpc.post.getFeed.infiniteQueryFilter({ limit: 20 }),
          (old: typeof data) => {
            if (!old) return old
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.map((item) => {
                  if (item.id !== postId) return item
                  const prevVote = item.userVote?.type ?? null
                  return {
                    ...item,
                    agreeCount:
                      item.agreeCount +
                      (type === "AGREE" ? 1 : 0) -
                      (prevVote === "AGREE" ? 1 : 0),
                    disagreeCount:
                      item.disagreeCount +
                      (type === "DISAGREE" ? 1 : 0) -
                      (prevVote === "DISAGREE" ? 1 : 0),
                    userVote: { type, userId: currentUserId ?? "" },
                  }
                }),
              })),
            }
          }
        )
        return { snapshot }
      },
      onError: (_err, _vars, ctx) => {
        ctx?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data))
        toast.error("Vote failed — please try again.")
      },
      onSettled: (_data, _err, { postId }) => {
        setPendingIds((prev) => { const s = new Set(prev); s.delete(postId); return s })
        void queryClient.invalidateQueries(trpc.post.getFeed.queryFilter())
      },
    })
  )

  const retractVoteMutation = useMutation(
    trpc.post.retractVote.mutationOptions({
      onMutate: async ({ postId }) => {
        setPendingIds((prev) => new Set(prev).add(postId))
        await queryClient.cancelQueries(trpc.post.getFeed.infiniteQueryFilter({ limit: 20 }))
        const snapshot = queryClient.getQueriesData(trpc.post.getFeed.infiniteQueryFilter({ limit: 20 }))
        queryClient.setQueriesData(
          trpc.post.getFeed.infiniteQueryFilter({ limit: 20 }),
          (old: typeof data) => {
            if (!old) return old
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.map((item) => {
                  if (item.id !== postId) return item
                  const prevVote = item.userVote?.type ?? null
                  return {
                    ...item,
                    agreeCount: item.agreeCount - (prevVote === "AGREE" ? 1 : 0),
                    disagreeCount: item.disagreeCount - (prevVote === "DISAGREE" ? 1 : 0),
                    userVote: null,
                  }
                }),
              })),
            }
          }
        )
        return { snapshot }
      },
      onError: (_err, _vars, ctx) => {
        ctx?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data))
        toast.error("Vote failed — please try again.")
      },
      onSettled: (_data, _err, { postId }) => {
        setPendingIds((prev) => { const s = new Set(prev); s.delete(postId); return s })
        void queryClient.invalidateQueries(trpc.post.getFeed.queryFilter())
      },
    })
  )

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  )

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: "200px" })
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [handleIntersect])

  const items = data?.pages.flatMap((p) => p.items) ?? []

  if (isLoading) return <FeedSkeleton count={3} />
  if (items.length === 0) return <FeedEmptyState />

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <PostCard
          key={item.id}
          id={item.id}
          type={item.type as "AWARD" | "DEDUCT" | "TASK"}
          title={item.title}
          cpAmount={item.cpAmount}
          mediaUrl={item.mediaUrl ?? undefined}
          outcome={item.outcome}
          settled={item.settled}
          votingEndsAt={item.votingEndsAt}
          createdAt={item.createdAt}
          author={item.author}
          targetUser={item.targetUser}
          agreeCount={item.agreeCount}
          disagreeCount={item.disagreeCount}
          userVote={item.userVote ? { type: item.userVote.type as "AGREE" | "DISAGREE" } : null}
          currentUserId={currentUserId}
          isPending={pendingIds.has(item.id)}
          onVote={(type) => castVoteMutation.mutate({ postId: item.id, type })}
          onRetract={() => retractVoteMutation.mutate({ postId: item.id })}
          replyCount={item._count.replies}
        />
      ))}
      <div ref={sentinelRef} className="h-4" aria-hidden="true" />
      {isFetchingNextPage && <FeedSkeleton count={2} />}
    </div>
  )
}
