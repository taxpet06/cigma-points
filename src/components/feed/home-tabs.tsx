"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useTRPC } from "@/trpc/client"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { FeedList } from "@/components/feed/feed-list"
import { FeedSkeleton } from "@/components/feed/feed-skeleton"
import { PostCard } from "@/components/post-card"
import { TaskCard } from "@/components/tasks/task-card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

function TaggedFeedList() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
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

  if (isError) {
    return (
      <div role="alert" className="py-16 text-center">
        <p className="text-sm font-medium mb-3">Couldn&apos;t load tagged posts.</p>
        <button
          onClick={() => void refetch()}
          className="text-sm text-primary underline underline-offset-2 cursor-pointer hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        >
          Try again
        </button>
      </div>
    )
  }

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
  const { data: tasks, isLoading, isError, refetch } = useQuery(trpc.task.getTasks.queryOptions())

  if (isLoading) return <FeedSkeleton count={3} />

  if (isError) {
    return (
      <div role="alert" className="py-16 text-center">
        <p className="text-sm font-medium mb-3">Couldn&apos;t load tasks.</p>
        <button
          onClick={() => void refetch()}
          className="text-sm text-primary underline underline-offset-2 cursor-pointer hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold mb-2">No tasks yet.</h2>
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
  const { data: users, isLoading, isError, refetch } = useQuery(trpc.user.getAll.queryOptions())

  if (isLoading) return <FeedSkeleton count={6} />

  if (isError) {
    return (
      <div role="alert" className="py-16 text-center">
        <p className="text-sm font-medium mb-3">Couldn&apos;t load members.</p>
        <button
          onClick={() => void refetch()}
          className="text-sm text-primary underline underline-offset-2 cursor-pointer hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold mb-2">No members yet.</h2>
        <p className="text-sm text-muted-foreground">Check back soon.</p>
      </div>
    )
  }

  const cardBase = "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors"

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {users.map((user) => {
        const initials = ((user.name || "?")[0] ?? "?").toUpperCase()
        const inner = (
          <>
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
              <AvatarFallback className="text-base font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="w-full min-w-0">
              <p className="truncate text-sm font-medium leading-tight">{user.name ?? "Unnamed"}</p>
              {user.username && (
                <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
              )}
              <p className="mt-1 text-xs font-semibold tabular-nums font-mono">
                {user.cigmaPoints} CP
              </p>
            </div>
          </>
        )
        return user.username ? (
          <Link
            key={user.id}
            href={`/u/${user.username}`}
            className={cn(cardBase, "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2")}
          >
            {inner}
          </Link>
        ) : (
          <div key={user.id} className={cardBase}>
            {inner}
          </div>
        )
      })}
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
    } catch {
      toast.error("Refresh failed — check your connection.")
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
      <div className="flex items-center border-b">
        <TabsList className="flex flex-1 h-auto rounded-none bg-transparent p-0">
          {(["posts", "tags", "tasks", "people"] as const).map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="flex-1 rounded-none px-0 py-3 text-base font-semibold capitalize transition-colors text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary -mb-px"
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh"
          className="ml-1 h-11 w-11 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <TabsContent value="posts" className="mt-0 pt-4">
        <FeedList />
      </TabsContent>
      <TabsContent value="tags" className="mt-0 pt-4">
        <TaggedFeedList />
      </TabsContent>
      <TabsContent value="tasks" className="mt-0 pt-4">
        <TasksList />
      </TabsContent>
      <TabsContent value="people" className="mt-0 pt-4">
        <PeopleList />
      </TabsContent>
    </Tabs>
  )
}
