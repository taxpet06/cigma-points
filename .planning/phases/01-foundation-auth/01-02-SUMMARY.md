---
phase: 01-foundation-auth
plan: 2
subsystem: database
tags: [prisma, neon, postgresql, schema, seed, db-connection]
dependency_graph:
  requires: [01-01]
  provides: [prisma-schema, neon-db-connection, db-singleton, seeded-users]
  affects: [01-03, 01-04]
tech_stack:
  added:
    - tsx@^4.22.4 (devDep — seed script runner)
  patterns:
    - Prisma v7 generator with "prisma-client" provider and explicit output path
    - prisma.config.ts with dotenv .env.local loading for Neon DIRECT_URL migrations
    - PrismaNeon adapter singleton in src/lib/db.ts (DATABASE_URL pooled at runtime)
    - node --env-file=.env.local for reliable env loading in seed scripts
key_files:
  created:
    - prisma/schema.prisma
    - prisma.config.ts
    - src/lib/db.ts
    - prisma/seed.ts
  modified:
    - tsconfig.json (added @/generated/* path alias)
    - package.json (added tsx devDep, db:seed script)
decisions:
  - "Prisma v7 generates TypeScript files with client.ts as entry point (no index.ts) — import path must be /prisma/generated/prisma/client not /prisma/generated/prisma"
  - "prisma.config.ts loads .env.local explicitly via dotenv { path: '.env.local' } — Prisma CLI does not auto-load Next.js .env.local"
  - "Seed uses node --env-file=.env.local to pre-load env before module initialization (ES module imports are hoisted; dotenvConfig in seed body runs too late for db.ts singleton)"
  - "db.ts imports from ../../prisma/generated/prisma/client (relative path) to work in both Next.js and tsx/seed contexts"
metrics:
  duration: "~26 minutes"
  completed_date: "2026-06-13"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
---

# Phase 01 Plan 02: Prisma v7 Schema + Neon DB Layer Summary

**One-liner:** Prisma v7 schema with full data model (User+roles+cigmaPoints, NextAuth models, Post/Vote/Reply/Task/TaskCompletion), pushed to Neon via DIRECT_URL, with PrismaNeon adapter singleton and seed proving a real write+read round-trip against the live database.

## What Was Built

The persistent data layer of the Walking Skeleton. A complete Prisma v7 schema defining all data models needed for the entire application, configured with the Neon PostgreSQL adapter (pooled URL for runtime, direct URL for migrations), pushed to the live Neon database, and verified with a seed script that proves real read/write operations against Neon.

## Tasks Completed

| Task | Name | Commit | Key Outputs |
|------|------|--------|-------------|
| 1 | Write Prisma v7 schema, config, and DB singleton | 060760c | prisma/schema.prisma, prisma.config.ts, src/lib/db.ts, tsconfig.json |
| 2 | Generate client, push schema to Neon, seed + verify | 599cf4b | prisma/generated/prisma/, prisma/seed.ts, Neon tables created, seed verified |

## Verification Results

- `prisma generate` succeeds — prisma/generated/prisma/ contains TypeScript client files
- `prisma db push` succeeded — schema live in Neon, 7 tables + 3 enums created
- Seed prints "admin@cigma.local (ADMIN, 100 CP)" and "user@cigma.local (USER, 0 CP)" — write+read proven
- `npx tsc --noEmit` — PASS (zero TypeScript errors after path fix)
- Schema has `@@unique([postId, userId])` on Vote model (VOTE-01 enforcement)
- No url= in datasource block (Prisma v7 pattern, uses prisma.config.ts)
- PrismaNeon adapter uses DATABASE_URL (pooled) — DIRECT_URL only in prisma.config.ts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prisma v7 generates client.ts not index.ts — import path must be explicit**
- **Found during:** Task 2 (seed execution)
- **Issue:** `import { PrismaClient } from "../../prisma/generated/prisma"` failed because Prisma v7 generates `client.ts` as the entry point (no `index.ts`). The module resolver could not find the directory without an index file.
- **Fix:** Updated `src/lib/db.ts` import to `../../prisma/generated/prisma/client`
- **Files modified:** src/lib/db.ts
- **Commit:** 599cf4b

**2. [Rule 1 - Bug] prisma.config.ts `import "dotenv/config"` does not load Next.js .env.local**
- **Found during:** Task 2 (prisma generate without DOTENV_CONFIG_PATH)
- **Issue:** The default `dotenv/config` import looks for `.env`, but all Cigma Points env vars live in `.env.local` (Next.js convention). Prisma CLI commands failed with "Cannot resolve environment variable: DIRECT_URL" when run without `DOTENV_CONFIG_PATH` preset.
- **Fix:** Changed `import "dotenv/config"` to explicit `config({ path: '.env.local' })` + fallback `config({ path: '.env' })` in `prisma.config.ts`
- **Files modified:** prisma.config.ts
- **Commit:** 599cf4b

**3. [Rule 1 - Bug] ES module import hoisting means dotenvConfig in seed.ts runs after db.ts singleton initialization**
- **Found during:** Task 2 (seed run)
- **Issue:** Even with `dotenvConfig` calls before the `import { db }` line in seed.ts, ES module imports are hoisted — `db.ts` initializes `PrismaNeon({ connectionString: process.env.DATABASE_URL! })` before dotenvConfig runs, resulting in an empty connection string.
- **Fix:** Seed script now runs via `node --env-file=.env.local tsx prisma/seed.ts` — Node 24's `--env-file` flag pre-loads env vars before any module is initialized. Added `db:seed` npm script using this pattern.
- **Files modified:** prisma/seed.ts, package.json
- **Commit:** 599cf4b

## Known Stubs

None — this plan creates infrastructure with no UI components or data dependencies.

## Threat Flags

None — no new network endpoints or auth paths introduced. Trust boundaries addressed:
- T-01-02: Passwords in seed.ts hashed via `bcrypt.hash(password, 12)` (ASVS V6 — never stored plaintext)
- T-01-03: No raw queries; all access via Prisma model API (parameterized)

## Self-Check: PASSED
