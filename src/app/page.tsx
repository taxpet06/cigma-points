// Home page — Walking Skeleton DB->tRPC->UI proof.
// Authenticated users see their name from the DB (via user.getMe) to confirm the chain.
// Unauthenticated users are redirected to /sign-in by middleware.ts.

import { createServerCaller } from "@/trpc/server"

export default async function HomePage() {
  // Prove the DB->tRPC->UI chain: read the user from the DB server-side.
  // createServerCaller reads the NextAuth session, then calls user.getMe which
  // queries Neon/Prisma. If the user is unauthenticated, middleware redirects
  // before this page renders.
  let me: Awaited<ReturnType<Awaited<ReturnType<typeof createServerCaller>>["user"]["getMe"]>> | null = null

  try {
    const trpc = await createServerCaller()
    me = await trpc.user.getMe()
  } catch {
    // Unauthenticated: middleware already handles the redirect, but guard here too
    me = null
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Welcome to Cigma Points
      </h1>
      {me && (
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Hello, <span className="font-medium text-zinc-900 dark:text-zinc-50">{me.name ?? me.email}</span>!
          You have <span className="font-semibold">{me.cigmaPoints} CP</span>.
        </p>
      )}
      <p className="mt-6 text-zinc-500 dark:text-zinc-400 text-sm">
        The community-driven points platform. Sign up, nominate your peers, and let the community decide.
      </p>
    </div>
  )
}
