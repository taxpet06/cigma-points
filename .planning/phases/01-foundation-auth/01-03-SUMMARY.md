---
phase: 01-foundation-auth
plan: 3
subsystem: auth
tags: [next-auth-v5, credentials, jwt, bcrypt, middleware, prisma-adapter, role-guard]
dependency_graph:
  requires: [01-01, 01-02]
  provides: [nextauth-config, jwt-sessions, signUp-action, admin-middleware, auth-helpers]
  affects: [01-04]
tech_stack:
  added: []
  patterns:
    - NextAuth v5 single auth.ts config (handlers + auth + signIn + signOut)
    - PrismaAdapter(db) with JWT session strategy (no database sessions)
    - TypeScript module augmentation for role + id on Session/User/JWT (project root next-auth.d.ts)
    - "use server" signUp action with bcrypt cost 12 and auto sign-in
    - Edge middleware auth wrapper (export default auth(...)) with admin role guard
    - Dual enforcement: middleware edge check + requireAdmin() server-side re-check (ASVS V4)
key_files:
  created:
    - src/auth.ts
    - next-auth.d.ts
    - src/app/api/auth/[...nextauth]/route.ts
    - src/lib/actions/auth.ts
    - src/app/api/auth/register/route.ts
    - src/lib/auth-helpers.ts
    - src/middleware.ts
  modified: []
decisions:
  - "PrismaAdapter(db as never) cast used to bridge Prisma v7 generated PrismaClient type to @auth/prisma-adapter's @prisma/client PrismaClient type — skipLibCheck:true + structural compatibility means tsc passes and runtime is correct (adapter uses duck typing)"
  - "signUp server action returns typed SignUpResult union instead of throwing for duplicate/invalid — allows forms to display errors without wrapping in try/catch"
  - "next-auth.d.ts at project root (not src/) — tsconfig **/*.ts glob covers it; placement per Pattern 5 from RESEARCH.md"
  - "Email normalization (trim + toLowerCase) applied in both authorize() and signUp to prevent email case duplicates"
metrics:
  duration: "~11 minutes"
  completed_date: "2026-06-13"
  tasks_completed: 2
  tasks_total: 2
  files_created: 7
---

# Phase 01 Plan 03: NextAuth v5 Auth System Summary

**One-liner:** NextAuth v5 credentials provider with bcrypt (cost 12), JWT sessions carrying role + id claims, TypeScript module augmentation, signUp server action, JSON register API route (201/409/400), requireSession/requireAdmin server-side re-checks, and edge middleware enforcing /admin access guard — full AUTH-01..04 implementation.

## What Was Built

The complete authentication and access-control slice of the Walking Skeleton.

- **src/auth.ts** — NextAuth v5 config: PrismaAdapter(db) with JWT strategy, Credentials provider with ASVS V5 input validation before the DB query, bcrypt.compare for timing-safe password verification, jwt callback copies user.role + user.id into the token, session callback exposes both on session.user (AUTH-02, AUTH-03, AUTH-04).
- **next-auth.d.ts** — TypeScript module augmentation at project root: extends Session.user with role + id, extends User with role + id + password, extends JWT with role + id. Avoids `satisfies AuthConfig` (Pitfall 3).
- **src/app/api/auth/[...nextauth]/route.ts** — Mounts NextAuth GET/POST handlers at the standard path.
- **src/lib/actions/auth.ts** — "use server" `signUp` action: validates name/email/password (ASVS V5), rejects duplicate emails with typed error result, bcrypt.hash cost 12 (ASVS V6 / T-01-08), creates USER row, auto signs-in via signIn("credentials") (AUTH-01).
- **src/app/api/auth/register/route.ts** — JSON POST handler: same validation + hash + create logic, returns 201/409/400 HTTP responses for programmatic consumers.
- **src/lib/auth-helpers.ts** — `requireSession()` and `requireAdmin()` server-side guard primitives for Server Components, Server Actions, and tRPC procedures (Pitfall 4 / T-01-06 dual enforcement).
- **src/middleware.ts** — Edge middleware wrapping `auth()`: redirects unauthenticated users to /sign-in, blocks non-ADMIN users from /admin routes, matcher excludes /api/auth and Next.js static internals (AUTH-04).

## Tasks Completed

| Task | Name | Commit | Key Outputs |
|------|------|--------|-------------|
| 1 | NextAuth v5 config, route handlers, and TypeScript role augmentation | 54d2c08 | src/auth.ts, next-auth.d.ts, src/app/api/auth/[...nextauth]/route.ts |
| 2 | Registration (signUp server action + register route), auth helpers, and admin middleware | 42e1543 | src/lib/actions/auth.ts, src/app/api/auth/register/route.ts, src/lib/auth-helpers.ts, src/middleware.ts |

## Verification Results

- `npx tsc --noEmit` — PASS (zero TypeScript errors, both tasks)
- `@auth/prisma-adapter` v2.11.2 + Prisma v7.8.0 compatibility — CONFIRMED (Assumption A1 resolved: adapter uses duck typing at runtime; type bridge via `as never` cast + skipLibCheck handles the generated-path vs @prisma/client type mismatch at compile time)
- `src/auth.ts` exports `handlers, auth, signIn, signOut` from `NextAuth({...})` — confirmed
- `src/auth.ts` uses PrismaAdapter and session strategy "jwt" — confirmed
- `src/auth.ts` does NOT contain `satisfies AuthConfig` — confirmed
- jwt callback copies user.role to token; session callback copies token.role to session.user.role and token.id/sub to session.user.id — confirmed
- `next-auth.d.ts` at project root, augments role on Session/User/JWT — confirmed
- `src/app/api/auth/[...nextauth]/route.ts` exports GET and POST — confirmed
- `src/lib/actions/auth.ts` is "use server", uses bcrypt.hash cost 12, validates before DB, typed error result — confirmed
- `src/app/api/auth/register/route.ts` returns 201/409/400 — confirmed
- `src/lib/auth-helpers.ts` exports requireSession and requireAdmin — confirmed
- `src/middleware.ts` uses export default auth(...), redirects non-admins from /admin to /, redirects unauthenticated to /sign-in — confirmed
- middleware config.matcher excludes /api/auth and Next.js internals — confirmed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing prisma/generated/ and node_modules in worktree**
- **Found during:** Task 1 verification (npx tsc --noEmit)
- **Issue:** The worktree is a git worktree whose working tree does not contain `prisma/generated/` (gitignored) or `node_modules/` (not committed). `tsc` could not resolve `../../prisma/generated/prisma/client` or any npm packages.
- **Fix:** Copied `prisma/generated/prisma/` from the main tree into the worktree (gitignored, not committed). Created a symlink `node_modules` → `/home/petros/Github/cigma-points/node_modules` in the worktree (also not committed, purely for tsc verification).
- **Files modified:** None committed — runtime worktree-only setup
- **Commit:** N/A (infrastructure setup, not source change)

**2. [Rule 2 - Missing] signUp action typed error result instead of raw throw**
- **Found during:** Task 2 implementation (plan said "Return a typed error result on validation/duplicate failure instead of throwing where the form needs to display it")
- **Issue:** Plan correctly identified this as required. Implemented `SignUpResult = { success: true } | { success: false; error: string }` union type to allow forms to display errors without opaque try/catch.
- **Fix:** Exported `SignUpResult` type and made `signUp` return it. signIn's NEXT_REDIRECT throw is not caught by the caller — documented in comment.
- **Files modified:** src/lib/actions/auth.ts
- **Commit:** 42e1543

**3. [Rule 2 - Missing] Email normalization in both authorize() and signUp**
- **Found during:** Task 1/2 implementation
- **Issue:** Without normalization, "User@Example.com" and "user@example.com" would be treated as different emails, leading to duplicate accounts and login failures.
- **Fix:** Applied `email.trim().toLowerCase()` in both `authorize()` (auth.ts) and `signUp` action + register route.
- **Files modified:** src/auth.ts, src/lib/actions/auth.ts, src/app/api/auth/register/route.ts
- **Commit:** 54d2c08, 42e1543

**4. [Rule 2 - Missing] session.user.id wired from token**
- **Found during:** Task 1 (plan specifies it; also required for tRPC getMe in Plan 4)
- **Issue:** Plan said "copy token.sub -> session.user.id so tRPC getMe (Plan 4) can look the user up by id". Added explicit `token.id = user.id` in jwt callback and `session.user.id = (token.id ?? token.sub)` in session callback. Also extended next-auth.d.ts JWT to include `id?: string` and Session.user/User to include `id: string`.
- **Files modified:** src/auth.ts, next-auth.d.ts
- **Commit:** 54d2c08

### PrismaAdapter + Prisma v7 Compatibility (Assumption A1)

The plan flagged this as an OPEN RISK. Resolution: `@auth/prisma-adapter` v2.11.2's TypeScript declaration imports `PrismaClient` from `@prisma/client`, while our `db` is typed from the Prisma v7 generated output path. The type systems are structurally incompatible at the declaration level, causing a `TS2345` error without the cast.

**Applied fix:** `PrismaAdapter(db as never)` — the `as never` cast satisfies the adapter's type parameter without asserting any specific type. At runtime the adapter uses pure duck typing (`const p = prisma; p.user.create(...)`) so there is no runtime mismatch. With `skipLibCheck: true` in tsconfig, the adapter's own `.d.ts` is not rechecked.

**Alternative considered (not applied):** Downgrade to Prisma v6. Not needed — the cast is a one-line solution with no runtime risk, and Prisma v7 is already pushed to Neon. Documenting per plan instructions.

## Known Stubs

None — all files implement real logic with no placeholder data or hardcoded empty values.

## Threat Flags

All new network endpoints and auth paths are within the plan's `<threat_model>` scope:

| Threat ID | Coverage |
|-----------|----------|
| T-01-05 | bcrypt.compare in authorize() (timing-safe); email + password validated before DB query |
| T-01-06 | middleware role check (edge) + requireAdmin() (server-side) — dual enforcement |
| T-01-07 | NextAuth JWT in HTTP-only cookie with Secure+SameSite=Lax defaults |
| T-01-08 | bcrypt.hash cost 12 in signUp action + register route; password never returned to client |
| T-01-09 | Rate limiting deferred to v2 (accepted per threat model) |

No new trust boundaries beyond what the plan's threat model covers.

## Self-Check: PASSED

- src/auth.ts — exists
- next-auth.d.ts — exists
- src/app/api/auth/[...nextauth]/route.ts — exists
- src/lib/actions/auth.ts — exists
- src/app/api/auth/register/route.ts — exists
- src/lib/auth-helpers.ts — exists
- src/middleware.ts — exists
- Commit 54d2c08 — present in git log
- Commit 42e1543 — present in git log
- npx tsc --noEmit — PASS
