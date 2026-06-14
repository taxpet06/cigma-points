---
phase: 02-user-profiles
plan: 01
subsystem: data-layer
tags: [prisma, trpc, uploadthing, validation, auth]
dependency_graph:
  requires: [01-04]
  provides: [username-schema, user-router-procedures, uploadthing-route, ssr-plugin]
  affects: [02-02, 02-03, 02-04]
tech_stack:
  added:
    - uploadthing (FileRouter, avatarUploader, onUploadComplete)
    - "@uploadthing/react" (NextSSRPlugin, generateUploadButton, generateUploadDropzone)
    - src/lib/validation/username.ts (shared Zod usernameSchema)
  patterns:
    - Prisma @unique nullable column with P2002 CONFLICT handling
    - Uploadthing FileRouter with NextAuth v5 auth() gate in middleware
    - tRPC cursor-based pagination (take: limit+1, pop nextCursor)
    - Mass-assignment guard (updateProfile input schema excludes role/cigmaPoints/userId)
key_files:
  created:
    - prisma/schema.prisma (username String? @unique added to User model)
    - src/lib/validation/username.ts (usernameSchema export)
    - src/app/api/uploadthing/core.ts (ourFileRouter, OurFileRouter type)
    - src/app/api/uploadthing/route.ts (GET, POST route handler)
    - src/lib/uploadthing.ts (UploadButton, UploadDropzone typed generators)
    - tests/unit/username-schema.test.ts (6 passing cases)
    - tests/unit/user-router.test.ts (10 passing + 1 skipped)
    - tests/e2e/profile.spec.ts (Wave 0 scaffold — PROF-01/02/03 skipped)
  modified:
    - src/trpc/routers/user.ts (getMe + claimUsername + updateProfile + getProfile + getPostHistory)
    - src/app/layout.tsx (NextSSRPlugin added before Providers)
    - .env.example (UPLOADTHING_TOKEN section added)
    - package.json (scripts fixed for Node 18/20 compatibility)
decisions:
  - "Prisma v7 CLI requires tsx wrapper on Node 18.19.1 due to ESM incompatibility in @prisma/dev (zeptomatch ESM-only)"
  - "Vitest 4.x and Next.js 16.x require Node 20; scripts updated to use /snap/node/current/bin/node (Node 20.20.2 via snap)"
  - "db push required --accept-data-loss flag due to unique constraint on existing table (all existing users have username=null, safe)"
  - "claimUsername select also returns username: true (in addition to getMe), hence grep count is 2 — both intentional"
metrics:
  duration: "~19 minutes"
  completed: "2026-06-14"
  tasks_completed: 3
  files_changed: 12
---

# Phase 02 Plan 01: Username Schema + User Router + Uploadthing Route Summary

**One-liner:** Prisma username migration, four tRPC profile procedures with STRIDE mitigations, and Uploadthing avatarUploader with NextAuth v5 auth gate + SSR plugin.

## What Was Built

### Task 1: Username Schema Migration + Wave 0 Test Scaffolds

Added `username String? @unique` to the User model in `prisma/schema.prisma` and pushed the migration to Neon DB. All existing users have `username = null` — PostgreSQL correctly treats multiple NULL values as non-conflicting for UNIQUE constraints.

Created `src/lib/validation/username.ts` exporting `usernameSchema` (3-20 chars, `/^[a-z0-9_]+$/` regex) as the single source of truth used by both tRPC input validation and client-side RHF validation.

Created `tests/unit/username-schema.test.ts` with 6 test cases (1 valid, 4 invalid edge cases). Created Wave 0 E2E scaffold `tests/e2e/profile.spec.ts` with three skipped `test.describe` blocks tagged PROF-01/02/03 — Plan 03 un-skips these once `/u/[username]` is built.

Updated `.env.example` with `UPLOADTHING_TOKEN` section and v7 vs v6 naming note.

### Task 2: User Router Procedures

Extended `src/trpc/routers/user.ts` with:
- `getMe`: added `username: true` to select (Pitfall 6 — nav avatar link needs it)
- `claimUsername`: usernameSchema input + P2002 → CONFLICT catch (T-02-03, T-02-05)
- `updateProfile`: name/bio/image only input schema — no role/cigmaPoints/userId (T-02-02)
- `getProfile`: explicit select excludes password/email (T-02-04); NOT_FOUND on missing user
- `getPostHistory`: cursor-based pagination, tab=sent|received, returns `{ items, nextCursor }`

`Prisma` namespace imported from `"../../../prisma/generated/prisma/client"` (v7 generated path, not `@prisma/client`).

Created `tests/unit/user-router.test.ts` with 10 passing input schema tests + 1 skipped (DB-level P2002 test deferred to E2E).

### Task 3: Uploadthing avatarUploader Route + Lib + SSR Plugin

Created `src/app/api/uploadthing/core.ts` with `avatarUploader` FileRouter:
- `middleware()` calls `auth()` and throws `UploadThingError("Unauthorized")` on no session (T-02-01)
- `onUploadComplete()` persists CDN URL to `User.image` via `db.user.update`

Created `src/app/api/uploadthing/route.ts` exporting `{ GET, POST }` via `createRouteHandler`.

Created `src/lib/uploadthing.ts` with `UploadButton` and `UploadDropzone` typed generators.

Added `NextSSRPlugin` to `src/app/layout.tsx` (prevents avatar loading flash on hydration).

## Verification Results

- `npx tsx prisma db push`: DB in sync
- `npx tsc --noEmit`: passes (0 errors)
- `npm run test:unit`: 16 passed, 1 skipped
- `npm run build`: compiles successfully, `/api/uploadthing` route registered

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Node 18.19.1 incompatibility with Prisma 7.8.0 CLI**
- **Found during:** Task 1 (db:push attempt)
- **Issue:** Prisma 7.8.0's `@prisma/dev` package requires `zeptomatch` which is ESM-only. Node 18.19.1's CJS loader cannot `require()` ESM modules. `npm run db:push` failed with `ERR_REQUIRE_ESM`.
- **Fix:** Updated `db:push`, `db:generate`, `db:migrate` scripts to prefix with `tsx` (which handles the ESM/CJS boundary). `tsx` is already a devDependency.
- **Files modified:** `package.json`

**2. [Rule 3 - Blocking] Node 18.19.1 incompatibility with Vitest 4.x and Next.js 16.x**
- **Found during:** Task 1 (test:unit attempt)
- **Issue:** Vitest 4.x requires `node:util` export `styleText` (added in Node 20.12.0). Next.js 16.2.9 requires Node >=20.9.0. Both fail on Node 18.19.1.
- **Fix:** Installed Node 20.20.2 via `snap install node --channel=20 --classic`. Updated `test:unit`, `test:e2e`, `dev`, `build`, `start` scripts to use `/snap/node/current/bin/node` explicitly.
- **Files modified:** `package.json`

**3. [Rule 1 - Deviation] db push required --accept-data-loss**
- **Found during:** Task 1 (first db push attempt)
- **Issue:** Adding `@unique` to an existing column in a non-empty table requires acknowledging potential data loss (if duplicates existed). All existing `username` values are `null`, so no actual data loss occurs.
- **Fix:** Used `--accept-data-loss` flag for the initial push.
- **Impact:** None — PostgreSQL UNIQUE on nullable column treats NULL as non-conflicting; existing users unaffected.

## Known Stubs

None. All procedures are fully implemented and wired. Test scaffolds are explicitly marked `test.skip` with comments explaining Plan 03 will un-skip them — this is intentional Wave 0 scaffolding, not stub data.

## Threat Surface Scan

No new threat surface beyond what the plan's STRIDE threat register documented (T-02-01 through T-02-SC). All five mitigations are present in code:
- T-02-01: `auth()` gate in `avatarUploader.middleware()` ✓
- T-02-02: `updateProfile` input schema excludes role/cigmaPoints/userId ✓
- T-02-03: `usernameSchema` regex `/^[a-z0-9_]+$/` on `claimUsername` input ✓
- T-02-04: `getProfile` explicit select, no password/email ✓
- T-02-05: `@unique` + P2002 catch in `claimUsername` ✓

## Self-Check: PASSED

Files exist:
- [x] prisma/schema.prisma — username field present
- [x] src/lib/validation/username.ts
- [x] src/app/api/uploadthing/core.ts
- [x] src/app/api/uploadthing/route.ts
- [x] src/lib/uploadthing.ts
- [x] tests/unit/username-schema.test.ts
- [x] tests/unit/user-router.test.ts
- [x] tests/e2e/profile.spec.ts
- [x] src/trpc/routers/user.ts (extended)
- [x] src/app/layout.tsx (NextSSRPlugin added)

Commits exist:
- [x] 0b56268 — Task 1: username schema migration + usernameSchema + Wave 0 test scaffolds
- [x] a18493e — Task 2: user router procedures
- [x] 7843498 — Task 3: Uploadthing avatarUploader route + lib + NextSSRPlugin
