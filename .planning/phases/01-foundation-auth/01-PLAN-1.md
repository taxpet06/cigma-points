---
phase: 01-foundation-auth
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - tsconfig.json
  - next.config.ts
  - tailwind.config.ts
  - .env.local
  - .env.example
  - .gitignore
  - vitest.config.ts
  - playwright.config.ts
  - tests/e2e/auth.spec.ts
  - tests/e2e/admin-guard.spec.ts
  - components.json
  - src/components/ui/
autonomous: false
requirements: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]
user_setup:
  - service: neon
    why: "PostgreSQL database — required for Prisma schema push (Plan 2) and all auth"
    env_vars:
      - name: DATABASE_URL
        source: "Neon Console -> Project -> Connection Details -> Pooled connection (hostname contains -pooler)"
      - name: DIRECT_URL
        source: "Neon Console -> Project -> Connection Details -> Direct connection (unpooled, no -pooler in hostname)"
    dashboard_config:
      - task: "Create a Neon project and a database"
        location: "https://console.neon.tech -> New Project"
  - service: nextauth
    why: "Session JWT signing secret"
    env_vars:
      - name: NEXTAUTH_SECRET
        source: "Generate with: openssl rand -base64 32"
      - name: NEXTAUTH_URL
        source: "http://localhost:3000 for local dev"

must_haves:
  truths:
    - "Project builds and dev server starts without errors"
    - "All Phase 1 dependencies are installed at the versions research verified"
    - "Test runners (Vitest, Playwright) are configured and discover their config"
    - "E2E test specs exist (failing) describing the four AUTH requirements"
  artifacts:
    - path: "package.json"
      provides: "Dependency manifest with pinned versions"
      contains: "next-auth"
    - path: "vitest.config.ts"
      provides: "Vitest configuration"
    - path: "playwright.config.ts"
      provides: "Playwright E2E configuration with baseURL"
    - path: "tests/e2e/auth.spec.ts"
      provides: "Failing E2E tests for AUTH-01/02/03"
    - path: "tests/e2e/admin-guard.spec.ts"
      provides: "Failing E2E test for AUTH-04"
    - path: ".env.example"
      provides: "Documented required env vars"
  key_links:
    - from: "playwright.config.ts"
      to: "tests/e2e/"
      via: "testDir config"
      pattern: "testDir.*tests/e2e"
---

<objective>
Scaffold the Cigma Points Next.js 16 project with all Phase 1 dependencies, test infrastructure, and environment configuration. This is the foundation slice of the Walking Skeleton — after this plan, the project compiles, the dev server runs, and the failing E2E test suite describes exactly what the rest of Phase 1 must make pass.

Purpose: Establish the real codebase (not a throwaway) with every dependency at the research-verified version, so subsequent plans build against a working toolchain.
Output: Working Next.js scaffold, installed deps, Vitest + Playwright configs, failing AUTH E2E specs, .env.local with placeholders.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-foundation-auth/01-RESEARCH.md

# Note: the repo root already contains .planning/, .claude/, CLAUDE.md, STACK.md, .git/.
# create-next-app must scaffold INTO the existing directory (do not create a nested cigma-points/ folder).
</context>

<tasks>

<task type="auto">
  <name>Task 1: Scaffold Next.js into existing repo + install all Phase 1 dependencies</name>
  <read_first>
    - .planning/phases/01-foundation-auth/01-RESEARCH.md (Standard Stack + Installation sections — exact versions)
    - /home/petros/Github/cigma-points/.gitignore
    - /home/petros/Github/cigma-points/package.json (only if it already exists)
  </read_first>
  <action>
    The repo directory already exists with .git, .planning, .claude, CLAUDE.md, STACK.md. Scaffold Next.js INTO this directory — do NOT create a nested `cigma-points/` subfolder.

    Run create-next-app targeting the current directory: `npx create-next-app@latest . --typescript --app --src-dir --tailwind --import-alias "@/*" --eslint --no-turbopack --yes`. If it refuses due to non-empty directory, scaffold into a temp dir and move generated files (app/, src/, package.json, tsconfig.json, next.config.ts, postcss/tailwind configs, eslint config, public/) into the repo root, preserving existing .planning/.claude/CLAUDE.md/STACK.md/.git.

    Pin Next to the research version: next@16.2.9.

    Install dependencies at these EXACT versions (pin in package.json, no caret on the beta):
    - Auth: `next-auth@5.0.0-beta.31 @auth/prisma-adapter@2.11.2`
    - Database: `@prisma/client@7.8.0 @prisma/adapter-neon@7.8.0 @neondatabase/serverless@1.1.0` and devDep `prisma@7.8.0`
    - tRPC + Query: `@trpc/server@11.17.0 @trpc/client@11.17.0 @trpc/tanstack-react-query@11.17.0 @tanstack/react-query@5.101.0 superjson@2.2.6`
    - Password hashing: `bcryptjs@3.0.3` and devDep `@types/bcryptjs@3.0.0`
    - Test runners (devDeps): `vitest@4.1.8 @playwright/test@1.60.0`
    - State (per STACK.md): `zustand` (latest)

    Add npm scripts to package.json: `"db:push": "prisma db push"`, `"db:generate": "prisma generate"`, `"db:migrate": "prisma migrate dev && prisma generate"`, `"test:unit": "vitest run", "test:e2e": "playwright test"`.

    Do NOT install Sentry in this plan (deferred per research — final wave, not on critical path).

    Initialize shadcn/ui: `npx shadcn@latest init --yes` (style: default, base color: slate). Then add Phase 1 components: `npx shadcn@latest add button input label card form avatar dropdown-menu --yes`. These land in src/components/ui/.

    Run `npx playwright install chromium` so E2E tests have a browser.
  </action>
  <verify>
    <automated>cd /home/petros/Github/cigma-points && npx tsc --noEmit && grep -q '5.0.0-beta.31' package.json && grep -q '"prisma": "7.8.0"' package.json && grep -q '@trpc/tanstack-react-query' package.json && test -d src/components/ui && echo OK</automated>
  </verify>
  <acceptance_criteria>
    - package.json contains next-auth pinned to 5.0.0-beta.31 (exact, no caret)
    - package.json contains prisma 7.8.0, @prisma/client 7.8.0, @prisma/adapter-neon 7.8.0
    - package.json contains @trpc/tanstack-react-query (not @trpc/react-query)
    - package.json does NOT contain @sentry/nextjs
    - src/components/ui/ contains button.tsx, input.tsx, card.tsx, form.tsx
    - `npx tsc --noEmit` exits 0
    - components.json exists at project root
  </acceptance_criteria>
  <done>create-next-app scaffold lives at repo root, all listed deps installed at pinned versions, shadcn components generated, TypeScript compiles clean.</done>
</task>

<task type="auto">
  <name>Task 2: Configure environment, test runners, and failing AUTH E2E specs (Wave 0 gaps)</name>
  <read_first>
    - .planning/phases/01-foundation-auth/01-RESEARCH.md (Validation Architecture + Wave 0 Gaps + Phase Requirements -> Test Map)
    - /home/petros/Github/cigma-points/.gitignore
    - /home/petros/Github/cigma-points/package.json
  </read_first>
  <action>
    Create `.env.example` documenting all required vars with placeholder values and comments explaining each:
    - `DATABASE_URL` — Neon POOLED connection string (hostname contains `-pooler`); add `?connect_timeout=15` to mitigate cold starts (research Pitfall 6). Used at runtime by PrismaNeon adapter.
    - `DIRECT_URL` — Neon UNPOOLED connection string (no `-pooler`); used by prisma.config.ts for db push/migrations.
    - `NEXTAUTH_SECRET` — generate via `openssl rand -base64 32`.
    - `NEXTAUTH_URL` — `http://localhost:3000` for local dev.

    Create `.env.local` with the same keys and placeholder values (the user fills real values at the checkpoint). Ensure `.env.local` and `prisma/generated/` are in `.gitignore`; ensure `.env.example` is NOT gitignored.

    Create `vitest.config.ts`: configure `test.environment = "node"`, `test.include = ["tests/unit/**/*.test.ts"]`, and a `@/*` path alias resolving to `src/`. Create empty `tests/unit/.gitkeep` (Phase 4 will add settlement math tests).

    Create `playwright.config.ts`: `testDir: "./tests/e2e"`, `use.baseURL: "http://localhost:3000"`, project chromium, and a `webServer` block that runs `npm run dev` on port 3000 with `reuseExistingServer: true`.

    Create `tests/e2e/auth.spec.ts` — FAILING specs (Nyquist scaffold) covering AUTH-01/02/03:
    - Test "user can sign up": visit /sign-up, fill name/email/password, submit, expect redirect to / and a signed-in indicator.
    - Test "user can log in": precondition a user exists, visit /sign-in, submit credentials, expect redirect to /.
    - Test "session persists across refresh": after login, reload page, expect still signed in.
    Mark these with a clear comment: these MUST pass after Plans 2-4 complete.

    Create `tests/e2e/admin-guard.spec.ts` — FAILING spec covering AUTH-04:
    - Test "regular user is redirected away from /admin": sign in as USER, navigate to /admin, expect redirect to /.
    - Test "admin user can access /admin": sign in as ADMIN, navigate to /admin, expect to see the admin page heading.

    Do NOT inline real selectors that don't exist yet — use role/label-based queries (getByRole, getByLabel) matching the forms Plan 4 will build (Email, Password, Name labels; submit buttons).
  </action>
  <verify>
    <automated>cd /home/petros/Github/cigma-points && test -f vitest.config.ts && test -f playwright.config.ts && grep -q 'testDir' playwright.config.ts && grep -q 'tests/e2e' playwright.config.ts && test -f tests/e2e/auth.spec.ts && test -f tests/e2e/admin-guard.spec.ts && grep -q 'DIRECT_URL' .env.example && grep -q '.env.local' .gitignore && echo OK</automated>
  </verify>
  <acceptance_criteria>
    - .env.example contains DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, NEXTAUTH_URL with explanatory comments
    - .env.local exists with the same keys (placeholders) and is listed in .gitignore
    - prisma/generated/ is listed in .gitignore
    - playwright.config.ts has testDir ./tests/e2e and baseURL http://localhost:3000
    - tests/e2e/auth.spec.ts exists with 3 tests (signup, login, persist)
    - tests/e2e/admin-guard.spec.ts exists with 2 tests (regular blocked, admin allowed)
    - tests use getByRole/getByLabel queries, not brittle CSS selectors
  </acceptance_criteria>
  <done>Env files documented and gitignored correctly, Vitest + Playwright configured, four AUTH requirements expressed as failing E2E specs that downstream plans will turn green.</done>
</task>

<task type="checkpoint:human-action" gate="blocking">
  <what-built>Project scaffold with all dependencies, test config, and .env.local with placeholder values.</what-built>
  <how-to-verify>
    Provide your real Neon and NextAuth credentials so Plan 2 can push the schema:
    1. Create a Neon project at https://console.neon.tech if you have not already.
    2. Copy the POOLED connection string (hostname contains `-pooler`) into `DATABASE_URL` in `.env.local`. Append `?connect_timeout=15`.
    3. Copy the DIRECT/unpooled connection string (no `-pooler`) into `DIRECT_URL` in `.env.local`.
    4. Generate a secret: run `openssl rand -base64 32` and paste into `NEXTAUTH_SECRET`.
    5. Confirm `NEXTAUTH_URL=http://localhost:3000`.
  </how-to-verify>
  <resume-signal>Type "env ready" once .env.local has real DATABASE_URL and DIRECT_URL values, or describe what you need help with.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| developer machine -> npm registry | Installing packages; supply-chain risk |
| .env.local -> git | Secrets must never be committed |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-SC | Tampering | npm installs (next-auth beta, prisma v7, trpc) | mitigate | All packages verified against npm registry in RESEARCH.md Package Legitimacy Audit (slopcheck defaulted to PyPI — false positives; manual npm verification done). Pin exact versions for beta. |
| T-01-01 | Information Disclosure | .env.local secrets | mitigate | .env.local in .gitignore; only .env.example (placeholders) committed |
</threat_model>

<verification>
- `npx tsc --noEmit` passes.
- `npm run dev` starts and serves http://localhost:3000.
- Playwright discovers specs: `npx playwright test --list` shows 5 tests.
- All packages at pinned versions in package.json.
</verification>

<success_criteria>
- Next.js 16 app scaffolded at repo root (no nested folder), TypeScript clean.
- All Phase 1 deps installed at research-verified versions; Sentry deferred.
- Vitest + Playwright configured; 5 failing AUTH E2E tests present.
- .env.local has real Neon + NextAuth values (post-checkpoint); secrets gitignored.
</success_criteria>

<output>
Create `.planning/phases/01-foundation-auth/01-01-SUMMARY.md` when done.
</output>
