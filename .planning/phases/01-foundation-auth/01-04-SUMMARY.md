---
phase: 01-foundation-auth
plan: 4
subsystem: trpc-ui
tags: [trpc-v11, tanstack-query, auth-pages, nav-shell, walking-skeleton]
dependency_graph:
  requires: [01-01, 01-02, 01-03]
  provides: [trpc-scaffold, user-getme, auth-pages, nav-shell, admin-placeholder]
  affects: []
tech_stack:
  added: []
  patterns:
    - tRPC v11 5-file scaffold (init.ts, query-client.ts, client.tsx, server.tsx, routers/)
    - createTRPCContext from @trpc/tanstack-react-query for TRPCProvider + useTRPC hook
    - fetchRequestHandler from @trpc/server/adapters/fetch for Next.js App Router route
    - superjson transformer for Date/undefined serialization across tRPC boundary
    - Server-side caller via t.createCallerFactory (exported from init.ts, not from @trpc/server directly)
    - HydrationBoundary + dehydrate from @tanstack/react-query for SSR data hydration
    - SessionProvider (next-auth/react) + TRPCReactProvider in a single Providers component
    - sign-in page uses next-auth/react signIn (client-safe), NOT @/auth signIn (server-only)
    - protectedProcedure throws UNAUTHORIZED for unauthenticated tRPC calls (T-01-10)
key_files:
  created:
    - src/trpc/init.ts
    - src/trpc/query-client.ts
    - src/trpc/client.tsx
    - src/trpc/server.tsx
    - src/trpc/routers/_app.ts
    - src/trpc/routers/user.ts
    - src/app/api/trpc/[trpc]/route.ts
    - src/components/providers.tsx
    - src/components/nav/header.tsx
    - src/app/(auth)/sign-in/page.tsx
    - src/app/(auth)/sign-up/page.tsx
    - src/app/admin/page.tsx
  modified:
    - src/app/layout.tsx (added Providers + Header)
    - src/app/page.tsx (replaced Next.js default with Walking Skeleton home)
decisions:
  - "createCallerFactory exported from init.ts (via t.createCallerFactory) rather than imported from @trpc/server -- the function exists in @trpc/server/unstable-core-do-not-import but not the stable index export"
  - "sign-in page uses next-auth/react signIn (client-safe) -- importing signIn from @/auth in a client component bundles prisma/generated/client.ts which uses node:url/node:path, causing a build error"
  - "TRPCProvider from @trpc/tanstack-react-query takes { queryClient, trpcClient } props -- v11 API differs from v10 @trpc/react-query (no separate QueryClientProvider needed inside TRPCProvider)"
  - "Admin page has requireAdmin() server-side re-check (Pitfall 4 / ASVS V4) despite middleware already gating access"
  - "useTRPC from @trpc/tanstack-react-query used in header for type-safe getMe query -- returns TRPCOptionsProxy for useQuery integration"
metrics:
  duration: "~25 minutes"
  completed_date: "2026-06-13"
  tasks_completed: 2
  tasks_total: 3
  files_created: 12
---

# Phase 01 Plan 04: tRPC v11 Layer + Auth Pages + Nav Shell Summary

**One-liner:** tRPC v11 5-file scaffold with superjson + protectedProcedure, user.getMe proving DB->tRPC->UI chain, root layout with Providers/Header, sign-up/sign-in forms wired to server actions, and admin placeholder — Walking Skeleton complete, awaiting E2E checkpoint verification.

## What Was Built

The complete data and UI layer of the Walking Skeleton:

- **tRPC v11 scaffold**: `init.ts` (context + procedures + createCallerFactory), `query-client.ts` (makeQueryClient with superjson dehydrate/hydrate), `client.tsx` (TRPCReactProvider + useTRPC hook via `createTRPCContext` from `@trpc/tanstack-react-query`), `server.tsx` (server-side caller + HydrateClient), `routers/_app.ts` + `routers/user.ts` (user.getMe protectedProcedure with password excluded).
- **tRPC route handler**: `src/app/api/trpc/[trpc]/route.ts` mounts `fetchRequestHandler` for GET + POST at `/api/trpc`.
- **Providers**: `src/components/providers.tsx` composes SessionProvider + TRPCReactProvider for the entire app.
- **Root layout**: Updated to wrap all pages with `<Providers>` and `<Header>` above a `<main>` content area.
- **Navigation shell**: `src/components/nav/header.tsx` shows CP balance + user dropdown (signOut) when authenticated, sign-in/sign-up links when not, and an /admin link only for ADMIN role (decorative per T-01-11 — real gate is middleware).
- **Home page**: `src/app/page.tsx` calls `createServerCaller()` → `user.getMe` to display the user's name and CP balance from the DB, proving the DB→tRPC→UI chain.
- **Sign-up page**: `src/app/(auth)/sign-up/page.tsx` with Name/Email/Password fields (accessible labels matching E2E spec), calls `signUp` server action, displays typed error responses.
- **Sign-in page**: `src/app/(auth)/sign-in/page.tsx` with Email/Password fields, uses `next-auth/react`'s `signIn` (client-safe import), navigates to `/` on success.
- **Admin placeholder**: `src/app/admin/page.tsx` renders "Admin Dashboard" heading with `requireAdmin()` defense-in-depth (Pitfall 4).

## Tasks Completed

| Task | Name | Commit | Key Outputs |
|------|------|--------|-------------|
| 1 | tRPC v11 scaffold + user.getMe + route handler + providers | 015f7a8 | src/trpc/ (5 files + 2 routers), src/app/api/trpc/[trpc]/route.ts, src/components/providers.tsx |
| 2 | Root layout + nav shell + sign-in/sign-up pages + admin placeholder | 630d398 | src/app/layout.tsx, src/app/page.tsx, src/components/nav/header.tsx, sign-in/sign-up/admin pages |

## Checkpoint Status

**Task 3 is a `checkpoint:human-verify` (blocking).** Execution paused — the user must start `npm run dev` and verify the complete Walking Skeleton E2E flow (sign-up, session persistence, sign-out/sign-in, admin guard, Playwright E2E suite).

## Verification Results

- `npx tsc --noEmit` — PASS (zero errors, both tasks)
- `npm run build` — PASS (Compiled successfully; 2 warnings about Prisma/edge runtime are pre-existing from middleware — not blocking)
- All 14 files created/modified exist on disk — PASS
- Commits 015f7a8, 630d398 present in git log — PASS

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] createCallerFactory not directly exported from @trpc/server stable index**
- **Found during:** Task 1 (tsc error `Module "@trpc/server" has no exported member 'createCallerFactory'`)
- **Issue:** RESEARCH.md Pattern 7 showed `import { createCallerFactory } from "@trpc/server"` but in v11.17.0 this function lives in `@trpc/server/unstable-core-do-not-import`. The `TRPCRootObject` (result of `initTRPC.context().create()`) exposes `createCallerFactory` as a property.
- **Fix:** Exported `createCallerFactory = t.createCallerFactory` from `src/trpc/init.ts`, then imported from `@/trpc/init` in `server.tsx`.
- **Files modified:** src/trpc/init.ts, src/trpc/server.tsx
- **Commit:** 015f7a8

**2. [Rule 1 - Bug] sign-in page imported server-only signIn from @/auth causing build error**
- **Found during:** Task 2 (`npm run build` failed with chunk generation error)
- **Issue:** `signIn` from `@/auth` is a Server Action that transitively imports `src/lib/db.ts` → `prisma/generated/prisma/client.ts`, which uses `node:url` and `node:path`. When bundled into a Client Component, Next.js cannot resolve these Node.js built-ins for the browser context.
- **Fix:** Changed sign-in page to use `signIn` from `next-auth/react` which is the client-safe import (calls NextAuth's `/api/auth/signin` endpoint via fetch, not a Server Action). Used `redirect: false` and manual `window.location.href = "/"` navigation on success.
- **Files modified:** src/app/(auth)/sign-in/page.tsx
- **Commit:** 630d398

## Known Stubs

- **src/app/admin/page.tsx**: Admin features are placeholder — "Admin features are coming in Phase 6." This is intentional per the plan; the purpose is to confirm the admin route gate works. Phase 6 delivers real admin UI.

## Threat Flags

No new threat surface beyond what the plan's `<threat_model>` covers:

| Threat ID | Coverage |
|-----------|----------|
| T-01-10 | protectedProcedure throws UNAUTHORIZED when !ctx.session?.user |
| T-01-11 | /admin link in header is decorative; real enforcement is middleware + requireAdmin() |
| T-01-12 | user.getMe select excludes password field |

## Self-Check: PASSED

All 14 created/modified files exist on disk. Commits 015f7a8 and 630d398 present in git log. `npx tsc --noEmit` passes. `npm run build` compiles successfully.
