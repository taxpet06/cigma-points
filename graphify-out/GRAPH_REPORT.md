# Graph Report - .  (2026-06-24)

## Corpus Check
- Corpus is ~33,367 words - fits in a single context window. You may not need a graph.

## Summary
- 461 nodes · 759 edges · 39 communities (20 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.92)
- Token cost: 1,004 input · 321 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Profile & Post Creation UI|Profile & Post Creation UI]]
- [[_COMMUNITY_Feed & Post Card Display|Feed & Post Card Display]]
- [[_COMMUNITY_tRPC Router Layer|tRPC Router Layer]]
- [[_COMMUNITY_npm Dependencies|npm Dependencies]]
- [[_COMMUNITY_App Layout & Providers|App Layout & Providers]]
- [[_COMMUNITY_Dev Tooling & Config|Dev Tooling & Config]]
- [[_COMMUNITY_Admin Panel UI|Admin Panel UI]]
- [[_COMMUNITY_Domain Model & Stack Decisions|Domain Model & Stack Decisions]]
- [[_COMMUNITY_Auth Actions & DB Settlement|Auth Actions & DB Settlement]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Component Aliases & Shadcn|Component Aliases & Shadcn]]
- [[_COMMUNITY_Profile Post History|Profile Post History]]
- [[_COMMUNITY_Post Detail & Thread View|Post Detail & Thread View]]
- [[_COMMUNITY_E2E Settlement Tests|E2E: Settlement Tests]]
- [[_COMMUNITY_E2E Voting Tests|E2E: Voting Tests]]
- [[_COMMUNITY_E2E Feed Tests|E2E: Feed Tests]]
- [[_COMMUNITY_E2E Thread Tests|E2E: Thread Tests]]
- [[_COMMUNITY_E2E Admin Task Tests|E2E: Admin Task Tests]]
- [[_COMMUNITY_NextAuth Type Augmentation|NextAuth Type Augmentation]]
- [[_COMMUNITY_Auth Config & Middleware|Auth Config & Middleware]]
- [[_COMMUNITY_E2E Admin Guard Tests|E2E: Admin Guard Tests]]
- [[_COMMUNITY_E2E Auth Tests|E2E: Auth Tests]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Styling Tailwind & Shadcn|Styling: Tailwind & Shadcn]]
- [[_COMMUNITY_NextAuth Route Handler|NextAuth Route Handler]]
- [[_COMMUNITY_File Icon Asset|File Icon Asset]]
- [[_COMMUNITY_Globe Icon Asset|Globe Icon Asset]]
- [[_COMMUNITY_Next.js Logo Asset|Next.js Logo Asset]]
- [[_COMMUNITY_Vercel Brand Asset|Vercel Brand Asset]]
- [[_COMMUNITY_Vercel Logo Asset|Vercel Logo Asset]]
- [[_COMMUNITY_Window Icon Asset|Window Icon Asset]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 21 edges
2. `compilerOptions` - 16 edges
3. `Button` - 15 edges
4. `scripts` - 12 edges
5. `Card` - 10 edges
6. `CardContent` - 10 edges
7. `CardHeader` - 9 edges
8. `Input` - 8 edges
9. `Vote Settlement (Vercel Cron → API Route)` - 8 edges
10. `PostCard()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Community Voting System` --semantically_similar_to--> `Vote Settlement (Vercel Cron → API Route)`  [INFERRED] [semantically similar]
  CLAUDE.md → STACK.md
- `Vercel Hobby Tier Constraint` --semantically_similar_to--> `Vercel Deployment`  [INFERRED] [semantically similar]
  CLAUDE.md → STACK.md
- `Uploadthing Storage Constraint` --semantically_similar_to--> `Uploadthing`  [INFERRED] [semantically similar]
  CLAUDE.md → STACK.md
- `Cigma Points Platform` --conceptually_related_to--> `Next.js 15 (App Router)`  [INFERRED]
  CLAUDE.md → STACK.md
- `TaskDetailPage()` --calls--> `requireSession()`  [INFERRED]
  src/app/tasks/[id]/page.tsx → src/lib/auth-helpers.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Vote Settlement Pipeline** — stack_vote_settlement, stack_vercel_deployment, stack_prisma_transaction, stack_neon_postgres, stack_cron_secret [EXTRACTED 1.00]
- **Type-Safe Fullstack Stack** — stack_nextjs_15, stack_trpc, stack_tanstack_query, stack_prisma_orm [INFERRED 0.85]
- **Authentication and Admin Role System** — stack_nextauth_v5, stack_admin_role, stack_prisma_orm, stack_neon_postgres [EXTRACTED 1.00]

## Communities (39 total, 19 thin omitted)

### Community 0 - "Profile & Post Creation UI"
Cohesion: 0.09
Nodes (35): EditProfileForm(), editProfileSchema, EditProfileValues, CreatePostValues, UserAutocomplete(), ClaimUsernameForm(), claimUsernameFormSchema, ClaimUsernameValues (+27 more)

### Community 1 - "Feed & Post Card Display"
Cohesion: 0.09
Nodes (29): formatRelativeTime(), PostCard(), PostCardProps, CreatePostButton(), CreatePostModal(), FeedEmptyState(), FeedList(), FeedSkeleton() (+21 more)

### Community 2 - "tRPC Router Layer"
Cohesion: 0.08
Nodes (26): @trpc/server, adminRouter, AppRouter, postRouter, replyRouter, taskRouter, userRouter, createTRPCContext() (+18 more)

### Community 3 - "npm Dependencies"
Cohesion: 0.06
Nodes (36): dependencies, @auth/prisma-adapter, @base-ui/react, bcryptjs, class-variance-authority, clsx, @hookform/resolvers, lucide-react (+28 more)

### Community 4 - "App Layout & Providers"
Cohesion: 0.08
Nodes (21): inter, jetbrainsMono, metadata, Providers(), UploadButton, UploadDropzone, Header(), DropdownMenuCheckboxItem (+13 more)

### Community 5 - "Dev Tooling & Config"
Cohesion: 0.07
Nodes (29): devDependencies, eslint, eslint-config-next, @playwright/test, prisma, tailwindcss, @tailwindcss/postcss, tsx (+21 more)

### Community 6 - "Admin Panel UI"
Cohesion: 0.11
Nodes (18): AdminTabs(), AdminPage(), AdminUser, AdminUserTable(), AdminUserTableProps, TaskDetailPage(), requireAdmin(), requireSession() (+10 more)

### Community 7 - "Domain Model & Stack Decisions"
Cohesion: 0.08
Nodes (28): Cigma Points Platform, Community Voting System, Point Request, Task Post, TypeScript Throughout Constraint, Uploadthing Storage Constraint, Vercel Hobby Tier Constraint, Admin Role (JWT Custom Claim) (+20 more)

### Community 8 - "Auth Actions & DB Settlement"
Cohesion: 0.10
Nodes (7): signUp(), SignUpResult, globalForPrisma, ExpiredPost, settlePost(), { handlers, auth, signIn, signOut }, MockOp

### Community 9 - "TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+12 more)

### Community 10 - "Component Aliases & Shadcn"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 11 - "Profile Post History"
Cohesion: 0.16
Nodes (10): EmptyStateProps, PostHistoryTabs(), PostHistoryTabsProps, TabPanelProps, Avatar, AvatarFallback, AvatarImage, TabsContent (+2 more)

### Community 12 - "Post Detail & Thread View"
Cohesion: 0.31
Nodes (5): buildTree(), ReplyThread(), ReplyThreadProps, ThreadSection(), ThreadSectionProps

### Community 18 - "NextAuth Type Augmentation"
Cohesion: 0.50
Nodes (3): JWT, Session, User

## Knowledge Gaps
- **179 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+174 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `npm Dependencies` to `tRPC Router Layer`, `Dev Tooling & Config`?**
  _High betweenness centrality (0.174) - this node is a cross-community bridge._
- **Why does `@trpc/client` connect `npm Dependencies` to `Profile & Post Creation UI`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _183 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Profile & Post Creation UI` be split into smaller, more focused modules?**
  _Cohesion score 0.08823529411764706 - nodes in this community are weakly interconnected._
- **Should `Feed & Post Card Display` be split into smaller, more focused modules?**
  _Cohesion score 0.08979591836734693 - nodes in this community are weakly interconnected._
- **Should `tRPC Router Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.07890070921985816 - nodes in this community are weakly interconnected._
- **Should `npm Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._