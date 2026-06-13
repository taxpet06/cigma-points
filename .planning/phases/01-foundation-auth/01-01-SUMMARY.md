---
phase: 01-foundation-auth
plan: 1
subsystem: scaffold
tags: [next.js, scaffold, dependencies, test-infra, env-config]
dependency_graph:
  requires: []
  provides: [next-js-scaffold, all-phase1-deps, vitest-config, playwright-config, auth-e2e-specs]
  affects: [01-02, 01-03, 01-04]
tech_stack:
  added:
    - next@16.2.9
    - react@19.2.4
    - react-dom@19.2.4
    - next-auth@5.0.0-beta.31
    - "@auth/prisma-adapter@2.11.2"
    - "@prisma/client@7.8.0"
    - "@prisma/adapter-neon@7.8.0"
    - "@neondatabase/serverless@1.1.0"
    - "@trpc/server@11.17.0"
    - "@trpc/client@11.17.0"
    - "@trpc/tanstack-react-query@11.17.0"
    - "@tanstack/react-query@5.101.0"
    - superjson@2.2.6
    - bcryptjs@3.0.3
    - zustand@^5.0.0
    - vitest@4.1.8
    - "@playwright/test@1.60.0"
    - shadcn/ui (button, input, label, card, form, avatar, dropdown-menu)
  patterns:
    - Next.js App Router with src/ directory layout
    - Vitest for unit tests (tests/unit/)
    - Playwright for E2E tests (tests/e2e/)
key_files:
  created:
    - package.json
    - tsconfig.json
    - next.config.ts
    - .gitignore
    - .env.example
    - .env.local
    - vitest.config.ts
    - playwright.config.ts
    - tests/e2e/auth.spec.ts
    - tests/e2e/admin-guard.spec.ts
    - tests/unit/.gitkeep
    - components.json
    - src/components/ui/ (button, input, label, card, form, avatar, dropdown-menu)
    - src/lib/utils.ts
  modified:
    - .gitignore (added .env.local, prisma/generated/, playwright-report/)
decisions:
  - "Used Node 24.16.0 via n to satisfy Next.js 16 engine requirement (>=20.9.0) — Node 18 on the system was too old"
  - "Scaffolded via temp dir then moved files, preserving existing CLAUDE.md and .planning/"
  - "shadcn init defaulted to Base library; overrode components.json to default style with slate base color and re-ran add"
metrics:
  duration: "~6 minutes"
  completed_date: "2026-06-13"
  tasks_completed: 2
  tasks_total: 3
  files_created: 28
---

# Phase 01 Plan 01: Next.js Scaffold + Dependencies Summary

**One-liner:** Next.js 16 scaffold at repo root with all Phase 1 deps pinned (next-auth 5.0.0-beta.31, prisma 7.8.0, tRPC v11), Vitest + Playwright configured, and 5 failing AUTH E2E specs expressing the AUTH-01..04 requirements.

## What Was Built

The Walking Skeleton foundation — a compilable Next.js 16 App Router project with all Phase 1 dependencies at research-verified pinned versions, shadcn/ui component set, Vitest unit test config, and 5 failing Playwright E2E specs that describe exactly what Plans 2-4 must make pass.

## Tasks Completed

| Task | Name | Commit | Key Outputs |
|------|------|--------|-------------|
| 1 | Scaffold Next.js + install Phase 1 deps | efdf492 | package.json, src/, shadcn components, node_modules |
| 2 | Env config, test runners, failing E2E specs | 8f349bf | .env.example, vitest.config.ts, playwright.config.ts, tests/e2e/ |
| - | Add playwright-report/ to .gitignore | 1c41673 | .gitignore |

## Checkpoint Status

**Task 3 is a `checkpoint:human-action` (blocking).** Execution paused — the user must provide real Neon PostgreSQL credentials and a NextAuth secret in `.env.local` before Plan 2 can push the database schema.

## Verification Results

- `npx tsc --noEmit` — PASS (zero errors)
- `npx playwright test --list` — PASS (5 tests in 2 files discovered)
- `next-auth@5.0.0-beta.31` in package.json — PASS (exact, no caret)
- `prisma@7.8.0` in devDependencies — PASS
- `@prisma/adapter-neon@7.8.0` in dependencies — PASS
- `@trpc/tanstack-react-query@11.17.0` — PASS (v11 adapter, not legacy @trpc/react-query)
- No `@sentry/nextjs` in package.json — PASS (deferred per plan)
- `src/components/ui/` contains button, input, label, card, form, avatar, dropdown-menu — PASS
- `.env.local` in `.gitignore` — PASS (T-01-01 threat mitigation)
- `prisma/generated/` in `.gitignore` — PASS

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Node.js version too old for Next.js 16**
- **Found during:** Task 1
- **Issue:** System Node.js is v18.19.1; `create-next-app@16.2.9` requires Node >=20.9.0
- **Fix:** Installed Node v24.16.0 via `n` package manager to user home directory ($HOME/.n/), used it for all npm operations in this plan
- **Files modified:** None (runtime only)
- **Commit:** efdf492 (used new Node for the scaffold)

**2. [Rule 3 - Blocking] create-next-app refused non-empty directory**
- **Found during:** Task 1
- **Issue:** The worktree already contained CLAUDE.md, STACK.md, and .planning/ — create-next-app refused to scaffold into a non-empty directory
- **Fix:** Scaffolded into `/tmp/nextjs-scaffold-*` temp directory, then copied generated files (src/, public/, package.json, tsconfig.json, next.config.ts, postcss.config.mjs, eslint.config.mjs) to worktree root — preserving existing CLAUDE.md, STACK.md, and .planning/
- **Files modified:** None (copying operation)
- **Commit:** efdf492

**3. [Rule 1 - Bug] shadcn init defaulted to Base library, not Radix/default style**
- **Found during:** Task 1
- **Issue:** `npx shadcn@latest init --defaults --yes` chose "Base" library ("base-nova" style) instead of the "default" (Radix) style with "slate" base color specified in the plan
- **Fix:** Manually overrode `components.json` to `style: "default", baseColor: "slate"`, then re-ran `npx shadcn@latest add ... --overwrite`
- **Files modified:** components.json
- **Commit:** efdf492

**4. [Rule 2 - Missing] playwright-report/ generated during verification, needed gitignore entry**
- **Found during:** Task 2 verification
- **Issue:** `npx playwright test --list` created a `playwright-report/` directory that would appear as untracked after verification
- **Fix:** Added `playwright-report/` and `test-results/` to .gitignore
- **Files modified:** .gitignore
- **Commit:** 1c41673

## Known Stubs

None — this plan creates infrastructure only (no UI components with data dependencies).

## Threat Flags

None — no new network endpoints or auth paths introduced. The only trust boundary addressed is T-01-01 (`.env.local` gitignored, per threat model).

## Self-Check: PASSED

All created files exist on disk. All 3 commits (efdf492, 8f349bf, 1c41673) confirmed present in git log.
