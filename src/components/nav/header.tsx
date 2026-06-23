"use client"
// Navigation shell header — shown on every page (Success Criterion 4).
//
// Signed-in state: app name link + CP balance badge + user dropdown (email + sign-out).
//   Admin users also see an /admin link.
// Signed-out state: app name link + Sign in / Sign up links.
//
// Security (T-01-11): /admin link is DECORATIVE — the real access gate is middleware.ts.
// useTRPC user.getMe is used to read the live DB balance so it stays current after
// point transfers (future phases). useSession is used for auth state and role display.

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { UserCircle, Sun, Moon } from "lucide-react"

export function Header() {
  const { data: session, status } = useSession()
  const trpc = useTRPC()

  // Fetch the current user's DB record for live CP balance (protectedProcedure)
  const { data: me } = useQuery(
    trpc.user.getMe.queryOptions(undefined, {
      enabled: status === "authenticated",
    })
  )

  const isAdmin = session?.user?.role === "ADMIN"
  const { theme, setTheme } = useTheme()

  return (
    <header className="border-b bg-white dark:bg-zinc-950 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: app name */}
        <Link
          href="/"
          className="font-semibold text-lg tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Cigma Points
        </Link>

        {/* Right: auth-aware actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Sun className="h-4 w-4 hidden dark:block" />
            <Moon className="h-4 w-4 dark:hidden" />
          </button>
          {status === "loading" && (
            <div className="h-8 w-24 bg-zinc-100 animate-pulse rounded" />
          )}

          {status === "authenticated" && session?.user && (
            <>
              {/* CP balance badge */}
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 tabular-nums">
                {me?.cigmaPoints ?? 0} CP
              </span>

              <Link
                href={me?.username ? `/u/${me.username}` : "/profile/edit"}
                aria-label="View your profile"
                className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <UserCircle className="h-5 w-5" aria-hidden="true" />
              </Link>

              {/* User dropdown (email + sign out) — separate trigger */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="text-xs text-zinc-500 hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400 rounded px-1"
                    aria-label="User menu"
                  >
                    ▾
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs text-zinc-500 font-normal truncate">
                    {session.user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/admin">Admin</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onSelect={() => signOut({ callbackUrl: "/sign-in" })}
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {status === "unauthenticated" && (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/sign-up">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
