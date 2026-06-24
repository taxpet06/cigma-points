"use client"
// PostHistoryTabs — client component rendering Sent/Received post history tabs.
//
// Each tab runs its own cursor-paginated getPostHistory infinite query.
// Uses shadcn Tabs with defaultValue="sent" (uncontrolled — no URL sync for MVP
// per Don't Hand-Roll / Pitfall 5 in RESEARCH.md).
//
// States per UI-SPEC Interaction States:
//   Loading (initial)  — 3 skeleton cards
//   Has posts          — PostCard list + load more button when nextCursor exists
//   Empty              — tab-specific empty state with role="status"

import { useInfiniteQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import { PostCard } from "@/components/post-card"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

// ---------------------------------------------------------------------------
// Skeleton card — matches PostCard dimensions for the loading state
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        {/* type badge + CP amount + outcome — matches PostCard header row */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded-full bg-muted" />
          <div className="h-5 w-10 rounded bg-muted" />
          <div className="ml-auto h-4 w-14 rounded bg-muted" />
        </div>
        {/* author → target */}
        <div className="mt-1 h-4 w-44 rounded bg-muted" />
      </CardHeader>
      <CardContent className="pb-3 space-y-2">
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="h-4 w-24 rounded bg-muted" />
      </CardContent>
      <CardFooter className="border-t pt-2">
        <div className="h-4 w-28 rounded bg-muted" />
      </CardFooter>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Empty state per tab
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  tab: "sent" | "received"
}

function EmptyState({ tab }: EmptyStateProps) {
  const heading =
    tab === "sent" ? "No posts sent yet" : "No posts received yet"
  const body =
    tab === "sent"
      ? "When you nominate someone for points, your posts will appear here."
      : "When someone nominates you for points, you'll see those posts here."

  return (
    <div role="status" className="py-16 text-center space-y-2">
      <p className="text-base font-semibold text-foreground">{heading}</p>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab content — handles one tab's full lifecycle (loading / posts / empty)
// ---------------------------------------------------------------------------

interface TabPanelProps {
  userId: string
  tab: "sent" | "received"
}

function TabPanel({ userId, tab }: TabPanelProps) {
  const trpc = useTRPC()

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    ...trpc.user.getPostHistory.infiniteQueryOptions(
      { userId, tab, limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    ),
  })

  const items = data?.pages.flatMap((p) => p.items) ?? []

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (items.length === 0) {
    return <EmptyState tab={tab} />
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <PostCard
          key={item.id}
          id={item.id}
          type={item.type as "AWARD" | "DEDUCT"}
          title={item.title}
          cpAmount={item.cpAmount}
          outcome={item.outcome}
          settled={item.settled}
          votingEndsAt={item.votingEndsAt}
          createdAt={item.createdAt}
          author={item.author}
          targets={item.targets}
          agreeCount={item.agreeCount}
          disagreeCount={item.disagreeCount}
        />
      ))}

      {hasNextPage && (
        <div className="pt-2 flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// PostHistoryTabs — exported component
// ---------------------------------------------------------------------------

export interface PostHistoryTabsProps {
  userId: string
}

export function PostHistoryTabs({ userId }: PostHistoryTabsProps) {
  return (
    <Tabs defaultValue="sent">
      <TabsList className="w-full">
        <TabsTrigger value="sent" className="flex-1">
          Sent
        </TabsTrigger>
        <TabsTrigger value="received" className="flex-1">
          Received
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sent" className="mt-4">
        <TabPanel userId={userId} tab="sent" />
      </TabsContent>

      <TabsContent value="received" className="mt-4">
        <TabPanel userId={userId} tab="received" />
      </TabsContent>
    </Tabs>
  )
}
