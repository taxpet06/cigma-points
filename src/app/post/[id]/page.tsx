// /post/[id] — Post detail page (server component).
//
// Security:
//   T-05-06 — explicit select on db.post.findUnique: never selects password or email.
//             author and targetUser limited to { id, name, image }.
//   T-05-07 — unknown/invalid post id → notFound(); Prisma parameterizes where:{id} (no injection).
//
// Next.js 15: params is a Promise — must await (PATTERNS.md async params pattern).

import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { db } from "@/lib/db"
import { PostCard } from "@/components/post-card"
import { ThreadSection } from "@/components/thread/thread-section"

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params // REQUIRED in Next.js 15 — params is a Promise

  // T-05-06: explicit select — never select password or email
  const post = await db.post.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      title: true,
      cpAmount: true,
      mediaUrl: true,
      outcome: true,
      settled: true,
      votingEndsAt: true,
      createdAt: true,
      author: { select: { id: true, name: true, image: true } },
      targets: { select: { user: { select: { id: true, name: true, image: true } } } },
    },
  })

  // T-05-07: unknown post id → notFound()
  if (!post) notFound()

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      {/* Back-context strip (UI-SPEC lines 220-226) */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Back to feed
      </Link>

      {/* Original post (read-only, no vote buttons, no reply count link) */}
      <PostCard
        id={post.id}
        type={post.type as "AWARD" | "DEDUCT"}
        title={post.title}
        cpAmount={post.cpAmount}
        mediaUrl={post.mediaUrl ?? undefined}
        outcome={post.outcome}
        settled={post.settled}
        votingEndsAt={post.votingEndsAt}
        createdAt={post.createdAt}
        author={post.author}
        targets={post.targets.map((t) => t.user)}
        replyCount={undefined}
      />

      {/* Interactive thread: compose + replies (client boundary) */}
      <div className="mt-4">
        <ThreadSection postId={post.id} />
      </div>
    </main>
  )
}
