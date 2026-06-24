// /u/[username] — Public profile server component.
//
// Security:
//   T-02-11 — explicit select: never returns password or email (Information Disclosure)
//   T-02-12 — Prisma parameterizes findUnique where:{username}; unknown -> notFound() (Tampering)
//
// Next.js 15: params is a Promise — must await (Pitfall 3 in RESEARCH.md).

import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserCircle, Pencil } from "lucide-react"
import { PostHistoryTabs } from "@/components/profile/post-history-tabs"

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params // REQUIRED in Next.js 15 — Pitfall 3

  const session = await auth()

  // T-02-11: explicit select — never password or email
  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      cigmaPoints: true,
      username: true,
    },
  })

  if (!user) notFound()

  const isOwner = session?.user?.id === user.id

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Profile header card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Avatar — h-20 w-20 per UI-SPEC Spacing */}
            <Avatar className="h-20 w-20 shrink-0">
              <AvatarImage
                src={user.image ?? undefined}
                alt={`${user.name ?? username}'s profile photo`}
              />
              <AvatarFallback>
                {/* D-11: UserCircle fallback — NO initials */}
                <UserCircle
                  className="h-full w-full text-muted-foreground"
                  aria-hidden="true"
                />
              </AvatarFallback>
            </Avatar>

            {/* Profile info */}
            <div className="flex-1 min-w-0">
              {/* Display name — text-xl semibold per UI-SPEC Typography */}
              <h1 className="text-xl font-semibold text-foreground truncate">
                {user.name ?? username}
              </h1>

              {/* @username — text-sm muted */}
              <p className="text-sm text-muted-foreground">@{username}</p>

              {/* Bio */}
              {user.bio && (
                <p className="mt-2 text-base text-foreground">{user.bio}</p>
              )}

              {/* CP balance — text-3xl semibold per UI-SPEC Typography Display role */}
              <p className="mt-3 text-2xl font-semibold text-foreground tabular-nums font-mono">
                {user.cigmaPoints} CP
              </p>

              {/* Owner-only: Edit profile link */}
              {isOwner && (
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href="/profile/edit">
                    <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                    Edit profile
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* D-07: Sent/Received post history tabs */}
      <PostHistoryTabs userId={user.id} />
    </main>
  )
}
