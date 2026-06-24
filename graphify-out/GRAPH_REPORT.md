# Graph Report - /home/petros/Github/cigma-points  (2026-06-24)

## Corpus Check
- 34 files · ~44,372 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 521 nodes · 819 edges · 46 communities (25 shown, 21 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.88)
- Token cost: 41,000 input · 8,100 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Profile & Form Components|Profile & Form Components]]
- [[_COMMUNITY_Auth & Settlement Backend|Auth & Settlement Backend]]
- [[_COMMUNITY_Home Feed UI|Home Feed UI]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_Design System & Brand Language|Design System & Brand Language]]
- [[_COMMUNITY_Dev Dependencies & Build Tooling|Dev Dependencies & Build Tooling]]
- [[_COMMUNITY_Admin Panel & Guards|Admin Panel & Guards]]
- [[_COMMUNITY_Platform Concepts & Stack Decisions|Platform Concepts & Stack Decisions]]
- [[_COMMUNITY_Root Layout & Navigation|Root Layout & Navigation]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_shadcnui Config|shadcn/ui Config]]
- [[_COMMUNITY_tRPC ClientServer Setup|tRPC Client/Server Setup]]
- [[_COMMUNITY_Post Detail & Reply Threads|Post Detail & Reply Threads]]
- [[_COMMUNITY_File Upload (Uploadthing)|File Upload (Uploadthing)]]
- [[_COMMUNITY_Logo Concept Designs|Logo Concept Designs]]
- [[_COMMUNITY_Settlement Outcome E2E Test|Settlement Outcome E2E Test]]
- [[_COMMUNITY_Voting E2E Test|Voting E2E Test]]
- [[_COMMUNITY_Posts Feed E2E Test|Posts Feed E2E Test]]
- [[_COMMUNITY_Threads E2E Test|Threads E2E Test]]
- [[_COMMUNITY_Username Schema Tests|Username Schema Tests]]
- [[_COMMUNITY_App Icon Set|App Icon Set]]
- [[_COMMUNITY_Admin Tasks E2E Test|Admin Tasks E2E Test]]
- [[_COMMUNITY_NextAuth Type Augmentation|NextAuth Type Augmentation]]
- [[_COMMUNITY_Auth Config & Middleware|Auth Config & Middleware]]
- [[_COMMUNITY_Admin Guard E2E Test|Admin Guard E2E Test]]
- [[_COMMUNITY_Auth E2E Test|Auth E2E Test]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_shadcn + Tailwind|shadcn + Tailwind]]
- [[_COMMUNITY_Dark Mode Design|Dark Mode Design]]
- [[_COMMUNITY_Route Handler Exports|Route Handler Exports]]
- [[_COMMUNITY_File Document Icon|File Document Icon]]
- [[_COMMUNITY_Globe Icon|Globe Icon]]
- [[_COMMUNITY_Next.js Wordmark|Next.js Wordmark]]
- [[_COMMUNITY_Vercel Platform|Vercel Platform]]
- [[_COMMUNITY_Vercel Logo|Vercel Logo]]
- [[_COMMUNITY_Window Icon|Window Icon]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 21 edges
2. `compilerOptions` - 16 edges
3. `Cigma Points Product` - 15 edges
4. `Button` - 15 edges
5. `Cigma Points Platform` - 13 edges
6. `scripts` - 12 edges
7. `Card` - 11 edges
8. `CardContent` - 11 edges
9. `CardHeader` - 10 edges
10. `Vote Settlement (Vercel Cron → API Route)` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Community Voting System` --semantically_similar_to--> `Vote Settlement (Vercel Cron → API Route)`  [INFERRED] [semantically similar]
  CLAUDE.md → STACK.md
- `Vercel Hobby Tier Constraint` --semantically_similar_to--> `Vercel Deployment`  [INFERRED] [semantically similar]
  CLAUDE.md → STACK.md
- `Uploadthing Storage Constraint` --semantically_similar_to--> `Uploadthing`  [INFERRED] [semantically similar]
  CLAUDE.md → STACK.md
- `Community Scoreboard Design North Star` --semantically_similar_to--> `Feed-as-Ledger Design Principle`  [INFERRED] [semantically similar]
  DESIGN.md → PRODUCT.md
- `Anti-Social-Media-Clone Principle` --semantically_similar_to--> `Anti-Reference: Social Media Clone`  [INFERRED] [semantically similar]
  DESIGN.md → PRODUCT.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cigma Points CP Logo Design Exploration** — concepts_concept_1_mark, concepts_concept_2_mark, concepts_concept_3_mark, concepts_concept_4_mark [INFERRED 0.85]
- **Concept 3 Iteration Lineage** — concepts_concept_3_mark, iterations_iteration_1_mark, iterations_iteration_2_mark [EXTRACTED 1.00]
- **Cigma Points CP Brand App Icon Set** — public_icon_192_mark, public_icon_512_mark, app_apple_icon_mark, app_icon_mark [INFERRED 0.85]

## Communities (46 total, 21 thin omitted)

### Community 0 - "Profile & Form Components"
Cohesion: 0.07
Nodes (46): EditProfileForm(), editProfileSchema, EditProfileValues, CreatePostValues, UserAutocomplete(), cn(), formatRelativeTime(), ClaimUsernameForm() (+38 more)

### Community 1 - "Auth & Settlement Backend"
Cohesion: 0.06
Nodes (26): signUp(), SignUpResult, globalForPrisma, ExpiredPost, settlePost(), adminRouter, postRouter, replyRouter (+18 more)

### Community 2 - "Home Feed UI"
Cohesion: 0.07
Nodes (22): PostCard(), PostCardProps, CreatePostModal(), FeedEmptyState(), FeedList(), FeedSkeleton(), HomeTabs(), TABS (+14 more)

### Community 3 - "Runtime Dependencies"
Cohesion: 0.06
Nodes (35): dependencies, @auth/prisma-adapter, @base-ui/react, bcryptjs, class-variance-authority, clsx, @hookform/resolvers, lucide-react (+27 more)

### Community 4 - "Design System & Brand Language"
Cohesion: 0.10
Nodes (34): Anti-Gamification Principle, Anti-Social-Media-Clone Principle, Brand Crimson Primary Color, Button Variants (Primary/Outline/Destructive/Ghost), Cigma Points Platform, Community Scoreboard Design North Star, Flat-by-Default Elevation System, Form Input / Field Style (+26 more)

### Community 5 - "Dev Dependencies & Build Tooling"
Cohesion: 0.07
Nodes (29): devDependencies, eslint, eslint-config-next, @playwright/test, prisma, tailwindcss, @tailwindcss/postcss, tsx (+21 more)

### Community 6 - "Admin Panel & Guards"
Cohesion: 0.11
Nodes (18): AdminTabs(), AdminPage(), AdminUser, AdminUserTable(), AdminUserTableProps, TaskDetailPage(), requireAdmin(), requireSession() (+10 more)

### Community 7 - "Platform Concepts & Stack Decisions"
Cohesion: 0.08
Nodes (28): Cigma Points Platform, Community Voting System, Point Request, Task Post, TypeScript Throughout Constraint, Uploadthing Storage Constraint, Vercel Hobby Tier Constraint, Admin Role (JWT Custom Claim) (+20 more)

### Community 8 - "Root Layout & Navigation"
Cohesion: 0.10
Nodes (18): inter, jetbrainsMono, metadata, viewport, Providers(), PullToRefresh(), CpLogo(), Header() (+10 more)

### Community 9 - "TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+12 more)

### Community 10 - "shadcn/ui Config"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 11 - "tRPC Client/Server Setup"
Cohesion: 0.18
Nodes (10): @trpc/client, @trpc/server, AppRouter, getQueryClient(), { TRPCProvider, useTRPC }, TRPCReactProvider(), createTRPCContext(), makeQueryClient() (+2 more)

### Community 12 - "Post Detail & Reply Threads"
Cohesion: 0.24
Nodes (7): ReplyCompose(), buildTree(), ReplyNode, ReplyThread(), ReplyThreadProps, ThreadSection(), ThreadSectionProps

### Community 13 - "File Upload (Uploadthing)"
Cohesion: 0.27
Nodes (5): UploadButton, UploadDropzone, f, OurFileRouter, { GET, POST }

### Community 14 - "Logo Concept Designs"
Cohesion: 0.44
Nodes (9): Cigma Points CP Monogram Brand Identity, Crimson/Rose Gradient Palette (#F43F5E to #7C1428), Concept 1 — Solid Filled CP Monogram on Rounded Tile, Concept 2 — Open-Ring CP with Rounded Terminals, Concept 3 — Monoline CP on Light Tile, Concept 4 — Solid Constant-Width Ring CP, Iteration 1 — Concept 3 Red on White, Iteration 2 — Color-Swapped White on Red (+1 more)

### Community 20 - "App Icon Set"
Cohesion: 1.00
Nodes (4): Cigma Points CP Apple Touch Icon, Cigma Points CP Tile Icon (SVG), Cigma Points CP Icon (192px PWA), Cigma Points CP Icon (512px PWA)

### Community 22 - "NextAuth Type Augmentation"
Cohesion: 0.50
Nodes (3): JWT, Session, User

## Knowledge Gaps
- **189 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+184 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Runtime Dependencies` to `tRPC Client/Server Setup`, `Dev Dependencies & Build Tooling`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `@trpc/client` connect `tRPC Client/Server Setup` to `Runtime Dependencies`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `cn()` connect `Profile & Form Components` to `Root Layout & Navigation`, `Home Feed UI`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _195 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Profile & Form Components` be split into smaller, more focused modules?**
  _Cohesion score 0.07287784679089027 - nodes in this community are weakly interconnected._
- **Should `Auth & Settlement Backend` be split into smaller, more focused modules?**
  _Cohesion score 0.05747126436781609 - nodes in this community are weakly interconnected._
- **Should `Home Feed UI` be split into smaller, more focused modules?**
  _Cohesion score 0.06976744186046512 - nodes in this community are weakly interconnected._