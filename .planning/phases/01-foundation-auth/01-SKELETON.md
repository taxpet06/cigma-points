# Walking Skeleton: Cigma Points

**Phase:** 1 — Foundation + Auth
**Created:** 2026-06-13

The Walking Skeleton is the thinnest possible end-to-end slice that proves the entire Cigma Points stack works together. It is the real codebase from day one — not a throwaway prototype. Every later phase builds on these architectural decisions without renegotiating them.

## What the Skeleton Proves

A new user can sign up, the session persists across a browser refresh (JWT), and the app correctly enforces admin-only access — with a real database read flowing all the way from Neon through tRPC to the rendered page.

The proven end-to-end chain:

```
Browser (sign-up form)
  -> signUp Server Action (bcrypt hash, cost 12)
  -> Prisma (PrismaNeon adapter, pooled DATABASE_URL)
  -> Neon PostgreSQL (users table)
  -> NextAuth credentials authorize() + JWT (role claim)
  -> middleware.ts (edge) enforces /admin role gate
  -> tRPC user.getMe (protectedProcedure) reads the user back
  -> Header renders name + CP balance
```

## Architectural Decisions (locked for subsequent phases)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 16.2.9, App Router, `src/` dir, `@/*` alias | Stack decision; unified frontend + API |
| Database | Neon PostgreSQL | Free serverless tier, relational fit |
| ORM | Prisma v7.8.0, `prisma-client` generator, output `./generated/prisma` | v7 breaking changes — import from generated path, NOT `@prisma/client` |
| DB connection | Two URLs: `DATABASE_URL` (pooled, runtime via PrismaNeon) + `DIRECT_URL` (unpooled, migrations via prisma.config.ts) | Neon pooler silently fails on DDL |
| Auth | NextAuth v5 (5.0.0-beta.31, pinned), single `src/auth.ts`, JWT strategy | App Router native; universal `auth()` |
| Adapter | `@auth/prisma-adapter` 2.11.2 | v5 package (NOT `@next-auth/prisma-adapter`) |
| Role system | `role` enum on User; copied into JWT + session via callbacks; augmented in root `next-auth.d.ts` | Per-request role with no extra DB query |
| Access control | `src/middleware.ts` (`auth()` wrapper) + server-side `requireAdmin()` re-check | Defense in depth — middleware is not the only gate |
| Password hashing | bcryptjs cost 12 | Pure JS, edge-safe |
| API contract | tRPC v11.17.0, `@trpc/tanstack-react-query`, superjson | Type-safe DB-to-UI; 5-file scaffold |
| UI | Tailwind v4 + shadcn/ui (components copied into `src/components/ui/`) | Accessible, customizable |
| Testing | Vitest (unit) + Playwright (E2E) | E2E covers all four AUTH requirements |
| Deferred to later wave | Sentry, Vercel Analytics | Not on the critical path for the skeleton |

## Directory Layout (established)

```
cigma-points/
├── prisma/
│   ├── schema.prisma          # full model (User, NextAuth, Post, Vote, Reply, Task, TaskCompletion)
│   ├── generated/prisma/      # v7 generated client (gitignored)
│   └── seed.ts                # proves write/read; seeds ADMIN + USER
├── prisma.config.ts           # v7 config — DIRECT_URL for migrations
├── next-auth.d.ts             # root module augmentation (role)
├── src/
│   ├── auth.ts                # NextAuth v5 single source of truth
│   ├── middleware.ts          # auth + admin role guard
│   ├── lib/
│   │   ├── db.ts              # PrismaClient singleton + PrismaNeon
│   │   ├── auth-helpers.ts    # requireSession, requireAdmin
│   │   └── actions/auth.ts    # signUp server action
│   ├── trpc/                  # init, query-client, client, server, routers/{_app,user}
│   ├── app/
│   │   ├── layout.tsx         # Providers + nav shell
│   │   ├── page.tsx           # authenticated home
│   │   ├── (auth)/sign-in, sign-up
│   │   ├── admin/page.tsx     # gated placeholder
│   │   └── api/{auth/[...nextauth],auth/register,trpc/[trpc]}/route.ts
│   └── components/{ui/, nav/header.tsx, providers.tsx}
└── tests/e2e/{auth.spec.ts, admin-guard.spec.ts}
```

## How to Verify the Skeleton

1. `npm run dev` — server starts on http://localhost:3000.
2. Sign up at /sign-up -> land signed in on / with name + CP balance in header.
3. Refresh -> still signed in (AUTH-03, JWT).
4. Sign out, sign in at /sign-in (AUTH-02).
5. As a USER, visit /admin -> redirected to / (AUTH-04).
6. As the seeded admin (admin@cigma.local), visit /admin -> see "Admin Dashboard".
7. `npx playwright test` -> 5 AUTH E2E tests green.

## Known Risk Carried Forward

`@auth/prisma-adapter` 2.11.2 + Prisma v7 custom output path compatibility is unverified (RESEARCH Open Question 1 / Assumption A1). Plan 3 verifies this first via `npx tsc --noEmit`. Fallback: pin Prisma to v6 (restore `prisma-client-js` generator + datasource url). Outcome documented in 01-03-SUMMARY.md.
