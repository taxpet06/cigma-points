"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react"
import Link from "next/link"
import { useTRPC } from "@/trpc/client"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { FeedList } from "@/components/feed/feed-list"
import { FeedSkeleton } from "@/components/feed/feed-skeleton"
import { PostCard } from "@/components/post-card"
import { TaskCard } from "@/components/tasks/task-card"

function TaggedFeedList() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    ...trpc.post.getTaggedFeed.infiniteQueryOptions(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    ),
  })

  const castVoteMutation = useMutation(
    trpc.post.castVote.mutationOptions({
      onMutate: async ({ postId, type }) => {
        setPendingIds((prev) => new Set(prev).add(postId))
        await queryClient.cancelQueries(trpc.post.getTaggedFeed.infiniteQueryFilter({ limit: 20 }))
        const snapshot = queryClient.getQueriesData(trpc.post.getTaggedFeed.infiniteQueryFilter({ limit: 20 }))
        queryClient.setQueriesData(
          trpc.post.getTaggedFeed.infiniteQueryFilter({ limit: 20 }),
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
                    agreeCount: item.agreeCount + (type === "AGREE" ? 1 : 0) - (prevVote === "AGREE" ? 1 : 0),
                    disagreeCount: item.disagreeCount + (type === "DISAGREE" ? 1 : 0) - (prevVote === "DISAGREE" ? 1 : 0),
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
        void queryClient.invalidateQueries(trpc.post.getTaggedFeed.queryFilter())
      },
    })
  )

  const retractVoteMutation = useMutation(
    trpc.post.retractVote.mutationOptions({
      onMutate: async ({ postId }) => {
        setPendingIds((prev) => new Set(prev).add(postId))
        await queryClient.cancelQueries(trpc.post.getTaggedFeed.infiniteQueryFilter({ limit: 20 }))
        const snapshot = queryClient.getQueriesData(trpc.post.getTaggedFeed.infiniteQueryFilter({ limit: 20 }))
        queryClient.setQueriesData(
          trpc.post.getTaggedFeed.infiniteQueryFilter({ limit: 20 }),
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
        void queryClient.invalidateQueries(trpc.post.getTaggedFeed.queryFilter())
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

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold mb-2">No tags yet.</h2>
        <p className="text-sm text-muted-foreground">
          Posts where you are nominated will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <PostCard
          key={item.id}
          id={item.id}
          type={item.type as "AWARD" | "DEDUCT"}
          title={item.title}
          explanation={item.explanation}
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

function TasksList() {
  const trpc = useTRPC()
  const { data: tasks, isLoading } = useQuery(trpc.task.getTasks.queryOptions())

  if (isLoading) return <FeedSkeleton count={3} />

  if (!tasks || tasks.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-xl font-semibold mb-2">No tasks yet.</p>
        <p className="text-sm text-muted-foreground">
          Check back later for tasks you can complete to earn CP.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          id={task.id}
          title={task.title}
          description={task.description}
          cpReward={task.cpReward}
          mediaUrl={task.mediaUrl}
          createdAt={task.createdAt}
          admin={task.admin}
          replyCount={task._count.replies}
        />
      ))}
    </div>
  )
}

function PeopleList() {
  const trpc = useTRPC()
  const { data: users, isLoading } = useQuery(trpc.user.getAll.queryOptions())

  if (isLoading) return <FeedSkeleton count={6} />

  if (!users || users.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-xl font-semibold mb-2">No members yet.</p>
        <p className="text-sm text-muted-foreground">Check back soon.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {users.map((user) => (
        <Link
          key={user.id}
          href={user.username ? `/u/${user.username}` : "#"}
          className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center hover:bg-muted/50 transition-colors"
        >
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
            <AvatarFallback className="text-base font-semibold">
              {(user.name ?? "?")[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="w-full min-w-0">
            <p className="truncate text-sm font-medium leading-tight">{user.name ?? "Unnamed"}</p>
            {user.username && (
              <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
            )}
            <p className="mt-1 text-xs font-semibold tabular-nums">
              {user.cigmaPoints} CP
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}

export function HomeTabs() {
  const [tab, setTab] = useState<"posts" | "tags" | "tasks" | "people">("posts")
  const [refreshing, setRefreshing] = useState(false)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  async function handleRefresh() {
    setRefreshing(true)
    try {
      if (tab === "posts") {
        await queryClient.refetchQueries(trpc.post.getFeed.infiniteQueryFilter({ limit: 20 }))
      } else if (tab === "tags") {
        await queryClient.refetchQueries(trpc.post.getTaggedFeed.infiniteQueryFilter({ limit: 20 }))
      } else if (tab === "tasks") {
        await queryClient.refetchQueries(trpc.task.getTasks.queryFilter())
      } else {
        await queryClient.refetchQueries(trpc.user.getAll.queryFilter())
      }
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <>
      <div className="flex items-center border-b">
        {(["posts", "tags", "tasks", "people"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-base font-semibold capitalize transition-colors ${
              tab === t
                ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh"
          className="p-2 ml-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {tab === "posts" && <FeedList />}
      {tab === "tags" && <TaggedFeedList />}
      {tab === "tasks" && <TasksList />}
      {tab === "people" && <PeopleList />}
    </>
  )
}
