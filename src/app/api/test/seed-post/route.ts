import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Test-only endpoint — never active in production
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { outcome, authorEmail, targetEmail, title } = await req.json() as {
    outcome: string
    authorEmail: string
    targetEmail: string
    title: string
  }

  const author = await db.user.findUniqueOrThrow({ where: { email: authorEmail } })
  const target = await db.user.findUniqueOrThrow({ where: { email: targetEmail } })

  const post = await db.post.create({
    data: {
      type: outcome === "Awarded" ? "AWARD" : "DEDUCT",
      title,
      explanation: "E2E test post",
      cpAmount: outcome === "Awarded" ? 5 : -3,
      authorId: author.id,
      targetUserId: target.id,
      votingEndsAt: new Date(Date.now() - 1000),
      settled: true,
      outcome,
    },
  })

  return NextResponse.json({ id: post.id })
}

export async function DELETE(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { id } = await req.json() as { id: string }
  await db.post.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
