---
phase: 01-foundation-auth
plan: 2
type: execute
wave: 2
depends_on: ["01-1"]
files_modified:
  - prisma/schema.prisma
  - prisma.config.ts
  - src/lib/db.ts
  - tsconfig.json
  - prisma/seed.ts
  - package.json
autonomous: false
requirements: [AUTH-01, AUTH-02, AUTH-04]

must_haves:
  truths:
    - "Prisma schema defines User (with role + cigmaPoints) and all NextAuth models"
    - "Schema is pushed to Neon and tables exist in the database"
    - "A real write + read against Neon succeeds (db connection proven)"
    - "Prisma client generates to a custom output path and is importable via @/lib/db"
  artifacts:
    - path: "prisma/schema.prisma"
      provides: "Full data model for the project"
      contains: "model User"
    - path: "prisma.config.ts"
      provides: "Prisma v7 config with DIRECT_URL for migrations"
      contains: "DIRECT_URL"
    - path: "src/lib/db.ts"
      provides: "PrismaClient singleton via PrismaNeon adapter"
      contains: "PrismaNeon"
    - path: "prisma/seed.ts"
      provides: "Seed script that proves a write/read against Neon (creates ADMIN + USER)"
  key_links:
    - from: "prisma.config.ts"
      to: "DIRECT_URL"
      via: "env(DIRECT_URL)"
      pattern: "DIRECT_URL"
    - from: "src/lib/db.ts"
      to: "DATABASE_URL"
      via: "PrismaNeon connectionString"
      pattern: "DATABASE_URL"
---

<objective>
Define the complete Prisma v7 data model, configure the Neon connection correctly (pooled for runtime, direct for migrations), push the schema to the database, and prove the DB connection with a real seed write/read. This is the data layer of the Walking Skeleton.

Purpose: Establish the persistent foundation every later phase builds on, using the Prisma v7 patterns research identified as breaking changes from all v6 tutorials.
Output: schema.prisma (full model), prisma.config.ts, db.ts singleton, seeded ADMIN + USER, schema pushed to Neon.
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

<interfaces>
<!-- Prisma v7 patterns the executor MUST follow exactly (from RESEARCH.md Pattern 1 & 6). -->

Generator (schema.prisma) — v7 breaking change:
  provider = "prisma-client"   (NOT "prisma-client-js")
  output   = "./generated/prisma"   (required in v7)

datasource db block in schema.prisma has NO url property in v7.
The migration URL is set in prisma.config.ts via env("DIRECT_URL").

Import path for the generated client (v7 — NOT "@prisma/client"):
  import { PrismaClient } from "@/generated/prisma"   (after tsconfig path alias)
  OR relative: import { PrismaClient } from "../generated/prisma"

Runtime client uses the Neon adapter:
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
  new PrismaClient({ adapter })
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Write Prisma v7 schema, config, and DB singleton</name>
  <read_first>
    - .planning/phases/01-foundation-auth/01-RESEARCH.md (Pattern 6: schema + config; Pattern 1: db singleton; Pitfalls 1, 2, 7)
    - /home/petros/Github/cigma-points/tsconfig.json
    - /home/petros/Github/cigma-points/.env.local
  </read_first>
  <action>
    Create `prisma/schema.prisma`:
    - generator client: `provider = "prisma-client"`, `output = "./generated/prisma"` (v7 pattern — Pitfall 1).
    - datasource db: `provider = "postgresql"`, NO url property (v7 — Pitfall 2; url comes from prisma.config.ts).
    - enum Role { USER ADMIN }
    - enum PostType { AWARD DEDUCT TASK }  (used in later phases; define now to avoid re-migration churn)
    - enum VoteType { AGREE DISAGREE }
    - enum CompletionStatus { PENDING AWARDED }
    - model User: id (cuid), name String?, email String? @unique, emailVerified DateTime?, image String?, bio String?, password String?, role Role @default(USER), cigmaPoints Int @default(0), accounts Account[], sessions Session[], plus relation back-references: posts Post[] @relation("author"), receivedPosts Post[] @relation("target"), votes Vote[], replies Reply[], tasksCreated Task[], taskCompletions TaskCompletion[], createdAt DateTime @default(now()), updatedAt DateTime @updatedAt, @@map("users").
    - NextAuth models exactly per research: Account, Session, VerificationToken (with @@map to accounts/sessions/verification_tokens).
    - model Post: id (cuid), authorId String, author User @relation("author", fields [authorId] references [id]), targetUserId String, targetUser User @relation("target", fields [targetUserId] references [id]), type PostType, title String, explanation String, cpAmount Int, mediaUrl String?, settled Boolean @default(false), outcome String?  (Awarded/Rejected, null until settled), votingEndsAt DateTime, votes Vote[], replies Reply[], createdAt DateTime @default(now()), @@map("posts"), @@index([createdAt]).
    - model Vote: id (cuid), postId String, post Post @relation(fields [postId] references [id] onDelete Cascade), userId String, user User @relation(fields [userId] references [id]), type VoteType, createdAt DateTime @default(now()), @@unique([postId, userId]) (enforces one vote per user per post — VOTE-01), @@map("votes").
    - model Reply: id (cuid), postId String, post Post @relation(fields [postId] references [id] onDelete Cascade), parentId String?, parent Reply? @relation("nested", fields [parentId] references [id], onDelete NoAction, onUpdate NoAction), children Reply[] @relation("nested"), authorId String, author User @relation(fields [authorId] references [id]), content String, mediaUrl String?, createdAt DateTime @default(now()), @@map("replies").
    - model Task: id (cuid), adminId String, admin User @relation(fields [adminId] references [id]), title String, description String, mediaUrl String?, cpReward Int?, completions TaskCompletion[], createdAt DateTime @default(now()), @@map("tasks").
    - model TaskCompletion: id (cuid), taskId String, task Task @relation(fields [taskId] references [id] onDelete Cascade), userId String, user User @relation(fields [userId] references [id]), status CompletionStatus @default(PENDING), awardedCp Int?, createdAt DateTime @default(now()), @@unique([taskId, userId]), @@map("task_completions").

    Create `prisma.config.ts` at project root (RESEARCH Pattern 6): `import "dotenv/config"; import { defineConfig, env } from "prisma/config";` exporting defineConfig with schema "prisma/schema.prisma", migrations path "prisma/migrations", and datasource.url = env("DIRECT_URL"). Add `"seed": "tsx prisma/seed.ts"` reference via package.json prisma block or config seed field.

    Create `src/lib/db.ts` (RESEARCH Pattern 1): import PrismaClient from "@/generated/prisma", import PrismaNeon from "@prisma/adapter-neon", build globalForPrisma singleton, create client with `new PrismaNeon({ connectionString: process.env.DATABASE_URL! })` adapter. Use DATABASE_URL (pooled) here, NOT DIRECT_URL.

    Update `tsconfig.json`: add path alias `"@/generated/*": ["./prisma/generated/*"]` (or ensure relative imports work) so db.ts resolves the generated client. Confirm `@/*` -> `src/*` exists.

    Add devDep `tsx` (latest) for running the seed script if not already present.
  </action>
  <verify>
    <automated>cd /home/petros/Github/cigma-points && grep -q 'provider = "prisma-client"' prisma/schema.prisma && grep -v '^//' prisma/schema.prisma | grep -q 'output' && ! grep -E '^\s*url\s*=' prisma/schema.prisma && grep -q 'DIRECT_URL' prisma.config.ts && grep -q 'PrismaNeon' src/lib/db.ts && grep -q 'DATABASE_URL' src/lib/db.ts && echo OK</automated>
  </verify>
  <acceptance_criteria>
    - prisma/schema.prisma generator uses provider "prisma-client" with an output path
    - prisma/schema.prisma datasource block has NO url= line
    - schema contains model User with role Role and cigmaPoints Int @default(0)
    - schema contains Account, Session, VerificationToken, Post, Vote, Reply, Task, TaskCompletion
    - Vote has @@unique([postId, userId])
    - prisma.config.ts uses env("DIRECT_URL")
    - src/lib/db.ts uses PrismaNeon with process.env.DATABASE_URL (pooled), not DIRECT_URL
  </acceptance_criteria>
  <done>Full schema, v7 config, and Neon-adapter singleton written following the research patterns exactly.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2 [BLOCKING]: Generate client, push schema to Neon, seed + verify a real read/write</name>
  <read_first>
    - .planning/phases/01-foundation-auth/01-RESEARCH.md (Pitfall 2: pooler vs direct URL; Pitfall 7: generate is separate from push)
    - /home/petros/Github/cigma-points/prisma/schema.prisma
    - /home/petros/Github/cigma-points/.env.local
  </read_first>
  <action>
    BLOCKING task — the phase cannot pass verification without this. Run in order:

    1. Generate the client: `npx prisma generate`. (v7 does NOT auto-generate — Pitfall 7. Confirm prisma/generated/prisma/ now contains the client.)

    2. Push the schema to Neon: `npx prisma db push`. This uses DIRECT_URL via prisma.config.ts (Pitfall 2 — pooler URL silently fails on DDL). For non-TTY/destructive runs use `npx prisma db push --accept-data-loss`. If push hangs or errors with "prepared statement" / connection errors, the DATABASE_URL/DIRECT_URL are swapped — DIRECT_URL must be the unpooled (no `-pooler`) string.

    3. Create `prisma/seed.ts`: import db from "@/lib/db" (or relative), import bcrypt. Create one ADMIN user (email admin@cigma.local, role ADMIN, hashed password via bcrypt.hash(..., 12), cigmaPoints 100) and one USER (email user@cigma.local, role USER, cigmaPoints 0) using `db.user.upsert` (idempotent on email). Then read both back with `db.user.findMany` and console.log the count + roles to prove the round-trip. These seeded accounts are what the E2E admin-guard tests in Plan 1 sign in as.

    4. Run the seed: `npx tsx prisma/seed.ts`. Confirm output shows 2 users with roles ADMIN and USER — this is the Walking Skeleton DB-connection proof.
  </action>
  <verify>
    <automated>cd /home/petros/Github/cigma-points && test -d prisma/generated/prisma && npx tsx prisma/seed.ts 2>&1 | grep -Eiq 'ADMIN' && echo OK</automated>
  </verify>
  <acceptance_criteria>
    - prisma/generated/prisma/ directory exists (client generated)
    - `npx prisma db push` completed successfully (tables created in Neon)
    - prisma/seed.ts upserts an ADMIN and a USER and reads them back
    - Running the seed prints both users including the ADMIN role (proves write+read against Neon)
    - No "prepared statement" or pooler DDL errors occurred during push
  </acceptance_criteria>
  <done>Client generated to custom path, schema live in Neon, seed proves a real write+read round-trip. DB layer of the Walking Skeleton verified.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| app server -> Neon PostgreSQL | All DB access; connection strings are secrets |
| seed script -> password storage | Passwords must be hashed, never plaintext |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-02 | Information Disclosure | seeded user passwords | mitigate | bcrypt.hash(password, 12) in seed.ts — never store plaintext (ASVS V6) |
| T-01-03 | Tampering | Prisma raw queries | accept | Schema uses only Prisma model API (parameterized); no $queryRawUnsafe with user input |
| T-01-04 | Denial of Service | Neon cold start on first connect | accept | connect_timeout=15 added to DATABASE_URL (Pitfall 6); MVP free tier acceptable |
</threat_model>

<verification>
- prisma/generated/prisma/ exists after generate.
- `npx prisma db push` succeeds against Neon (no pooler DDL errors).
- Seed prints ADMIN + USER read back from the database.
- `npx tsc --noEmit` still passes with db.ts importing the generated client.
</verification>

<success_criteria>
- Complete Prisma v7 schema (User+role+cigmaPoints, NextAuth models, Post/Vote/Reply/Task/TaskCompletion).
- prisma.config.ts and db.ts follow v7 + Neon adapter patterns exactly.
- Schema pushed to Neon; seed proves a real read/write (DB connection verified).
</success_criteria>

<output>
Create `.planning/phases/01-foundation-auth/01-02-SUMMARY.md` when done.
</output>
