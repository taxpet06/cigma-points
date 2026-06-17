"use client"

import { useCallback, useEffect, useRef } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import { PostCard } from "@/components/post-card"
import { FeedSkeleton } from "@/components/feed/feed-skeleton"
import { FeedEmptyState } from "@/components/feed/feed-empty-state"

export function FeedList() {
  const trpc = useTRPC()
  const sentinelRef = useRef<HTMLDivElement>(null)

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

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  )

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    })
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }
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
          voteCount={item._count.votes}
          replyCount={item._count.replies}
        />
      ))}
      <div ref={sentinelRef} className="h-4" aria-hidden="true" />
      {isFetchingNextPage && <FeedSkeleton count={2} />}
    </div>
  )
}
