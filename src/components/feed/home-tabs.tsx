"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Home, Tag, ListChecks, Users, Plus } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useTRPC } from "@/trpc/client"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { FeedList } from "@/components/feed/feed-list"
import { FeedSkeleton } from "@/components/feed/feed-skeleton"
import { PullToRefresh } from "@/components/feed/pull-to-refresh"
import { CreatePostModal } from "@/components/feed/create-post-modal"
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
        <Button variant="link" size="sm" onClick={() => void refetch()}>
          Try again
        </Button>
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
      {items.map((item, i) => (
        <PostCard
          key={item.id}
          index={i}
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
          targets={item.targets}
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
        <Button variant="link" size="sm" onClick={() => void refetch()}>
          Try again
        </Button>
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
        <Button variant="link" size="sm" onClick={() => void refetch()}>
          Try again
        </Button>
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

  const cardBase = "flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-[transform,border-color,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-primary/30 animate-card-rise"

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {users.map((user, i) => {
        const initials = ((user.name || "?")[0] ?? "?").toUpperCase()
        const stagger = { "--i": i % 8 } as React.CSSProperties
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
            style={stagger}
            className={cn(cardBase, "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2")}
          >
            {inner}
          </Link>
        ) : (
          <div key={user.id} style={stagger} className={cardBase}>
            {inner}
          </div>
        )
      })}
    </div>
  )
}

const TABS = [
  { value: "posts", label: "Posts", icon: Home },
  { value: "tags", label: "Tags", icon: Tag },
  { value: "tasks", label: "Tasks", icon: ListChecks },
  { value: "people", label: "People", icon: Users },
] as const

type TabValue = (typeof TABS)[number]["value"]

export function HomeTabs() {
  const [tab, setTab] = useState<TabValue>("posts")
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // Pull-to-refresh refetches whichever tab is active (replaces the old button).
  const handleRefresh = useCallback(async () => {
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
    }
  }, [tab, queryClient, trpc])

  const triggerClass =
    "group flex min-w-[3rem] flex-col items-center justify-center gap-0.5 rounded-full px-3 py-2 text-[0.65rem] font-medium text-muted-foreground transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 sm:min-w-0 sm:flex-row sm:gap-1.5 sm:px-4 sm:text-sm"

  function renderTrigger(t: (typeof TABS)[number]) {
    const Icon = t.icon
    return (
      <TabsTrigger key={t.value} value={t.value} className={triggerClass} aria-label={t.label}>
        <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[state=active]:scale-110 group-active:scale-90" />
        <span className="leading-none">{t.label}</span>
      </TabsTrigger>
    )
  }

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
      <PullToRefresh onRefresh={handleRefresh}>
        <TabsContent value="posts" className="mt-0">
          <FeedList />
        </TabsContent>
        <TabsContent value="tags" className="mt-0">
          <TaggedFeedList />
        </TabsContent>
        <TabsContent value="tasks" className="mt-0">
          <TasksList />
        </TabsContent>
        <TabsContent value="people" className="mt-0">
          <PeopleList />
        </TabsContent>
      </PullToRefresh>

      {/* Floating bottom navigation — icon tabs + center create button (mobile-first) */}
      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-[var(--z-sticky)] flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <TabsList className="pointer-events-auto flex h-auto items-center gap-0.5 rounded-full border bg-background/80 p-1.5 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-background/70 sm:gap-1">
          {renderTrigger(TABS[0])}
          {renderTrigger(TABS[1])}
          <CreatePostModal
            trigger={
              <button
                type="button"
                aria-label="Create post"
                className="mx-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-primary/60 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Plus className="h-6 w-6" />
              </button>
            }
          />
          {renderTrigger(TABS[2])}
          {renderTrigger(TABS[3])}
        </TabsList>
      </nav>
    </Tabs>
  )
}
