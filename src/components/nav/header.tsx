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
import { UserCircle, Sun, Moon, ChevronDown } from "lucide-react"

export function Header() {
  const { data: session, status } = useSession()
  const trpc = useTRPC()

  // Fetch the current user's DB record for live CP balance (protectedProcedure).
  // Poll every 60s so the balance stays current after cron settlements and admin edits.
  const { data: me, isLoading: meLoading } = useQuery(
    trpc.user.getMe.queryOptions(undefined, {
      enabled: status === "authenticated",
      refetchInterval: 60_000,
    })
  )

  const isAdmin = session?.user?.role === "ADMIN"
  const { theme, setTheme } = useTheme()

  return (
    <header className="border-b bg-background sticky top-0 z-10 pt-[env(safe-area-inset-top)]">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: app name */}
        <Link
          href="/"
          className="font-semibold text-lg tracking-tight text-primary"
        >
          Cigma Points
        </Link>

        {/* Right: auth-aware actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="flex items-center justify-center h-11 w-11 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Sun className="h-4 w-4 hidden dark:block" aria-hidden="true" />
            <Moon className="h-4 w-4 dark:hidden" aria-hidden="true" />
          </button>
          {status === "loading" && (
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          )}

          {status === "authenticated" && session?.user && (
            <>
              {/* CP balance */}
              {meLoading ? (
                <div className="h-5 w-14 bg-muted animate-pulse rounded" aria-hidden="true" />
              ) : (
                <span className="text-sm font-medium text-foreground tabular-nums font-mono">
                  {me?.cigmaPoints ?? 0} CP
                </span>
              )}

              <Link
                href={me?.username ? `/u/${me.username}` : "/profile/edit"}
                aria-label="View your profile"
                className="flex items-center justify-center h-11 w-11 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <UserCircle className="h-5 w-5" aria-hidden="true" />
              </Link>

              {/* User dropdown (email + sign out) — separate trigger */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center justify-center h-11 w-11 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="User menu"
                  >
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal truncate">
                    {session.user.email ?? "—"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/admin">Admin</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
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
