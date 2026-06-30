# Graph Report - .  (2026-06-26)

## Corpus Check
- 26 files · ~45,756 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 526 nodes · 797 edges · 47 communities (27 shown, 20 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Home Feed & Post Cards|Home Feed & Post Cards]]
- [[_COMMUNITY_Profile & Post Creation Forms|Profile & Post Creation Forms]]
- [[_COMMUNITY_tRPC Routers & Client|tRPC Routers & Client]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_Design System & Brand|Design System & Brand]]
- [[_COMMUNITY_Auth & Admin Panels|Auth & Admin Panels]]
- [[_COMMUNITY_Build Tooling & Dev Deps|Build Tooling & Dev Deps]]
- [[_COMMUNITY_Platform Domain Concepts|Platform Domain Concepts]]
- [[_COMMUNITY_Root Layout & Uploads|Root Layout & Uploads]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_shadcn Components Config|shadcn Components Config]]
- [[_COMMUNITY_Reply & Task Threads|Reply & Task Threads]]
- [[_COMMUNITY_Header & Dropdown UI|Header & Dropdown UI]]
- [[_COMMUNITY_Post Validation Schemas|Post Validation Schemas]]
- [[_COMMUNITY_CP Logo Concepts|CP Logo Concepts]]
- [[_COMMUNITY_Settlement & Cron|Settlement & Cron]]
- [[_COMMUNITY_Settlement E2E Tests|Settlement E2E Tests]]
- [[_COMMUNITY_Voting E2E Tests|Voting E2E Tests]]
- [[_COMMUNITY_Posts Feed E2E Tests|Posts Feed E2E Tests]]
- [[_COMMUNITY_Threads E2E Tests|Threads E2E Tests]]
- [[_COMMUNITY_PWA Icons|PWA Icons]]
- [[_COMMUNITY_Admin Tasks E2E|Admin Tasks E2E]]
- [[_COMMUNITY_NextAuth Types|NextAuth Types]]
- [[_COMMUNITY_Auth Middleware Config|Auth Middleware Config]]
- [[_COMMUNITY_Admin Guard E2E|Admin Guard E2E]]
- [[_COMMUNITY_Auth E2E|Auth E2E]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next Config|Next Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_UI Framework|UI Framework]]
- [[_COMMUNITY_Dark Mode Design|Dark Mode Design]]
- [[_COMMUNITY_UploadThing Route|UploadThing Route]]
- [[_COMMUNITY_File Icon|File Icon]]
- [[_COMMUNITY_Globe Icon|Globe Icon]]
- [[_COMMUNITY_Next.js Wordmark|Next.js Wordmark]]
- [[_COMMUNITY_Vercel Platform|Vercel Platform]]
- [[_COMMUNITY_Vercel Logo|Vercel Logo]]
- [[_COMMUNITY_Window Icon|Window Icon]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 19 edges
2. `compilerOptions` - 16 edges
3. `Cigma Points Product` - 15 edges
4. `Button` - 15 edges
5. `scripts` - 14 edges
6. `Cigma Points Platform` - 13 edges
7. `Card` - 11 edges
8. `CardContent` - 11 edges
9. `CardHeader` - 10 edges
10. `Input` - 9 edges

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

## Communities (47 total, 20 thin omitted)

### Community 0 - "Home Feed & Post Cards"
Cohesion: 0.06
Nodes (39): PostCard(), PostCardProps, FeedList(), FeedSkeleton(), HomeTabs(), TABS, TabValue, VoteButtons() (+31 more)

### Community 1 - "Profile & Post Creation Forms"
Cohesion: 0.08
Nodes (30): EditProfileForm(), editProfileSchema, EditProfileValues, CreatePostModal(), CreatePostValues, FeedEmptyState(), SelectedUser, UserMultiAutocomplete() (+22 more)

### Community 2 - "tRPC Routers & Client"
Cohesion: 0.08
Nodes (25): @trpc/client, @trpc/server, adminRouter, AppRouter, replyRouter, taskRouter, userRouter, getQueryClient() (+17 more)

### Community 3 - "Runtime Dependencies"
Cohesion: 0.06
Nodes (35): dependencies, @auth/prisma-adapter, @base-ui/react, bcryptjs, class-variance-authority, clsx, @hookform/resolvers, lucide-react (+27 more)

### Community 4 - "Design System & Brand"
Cohesion: 0.10
Nodes (34): Anti-Gamification Principle, Anti-Social-Media-Clone Principle, Brand Crimson Primary Color, Button Variants (Primary/Outline/Destructive/Ghost), Cigma Points Platform, Community Scoreboard Design North Star, Flat-by-Default Elevation System, Form Input / Field Style (+26 more)

### Community 5 - "Auth & Admin Panels"
Cohesion: 0.09
Nodes (16): signUp(), SignUpResult, AdminTabs(), AdminPage(), AdminUser, AdminUserTable(), AdminUserTableProps, TaskDetailPage() (+8 more)

### Community 6 - "Build Tooling & Dev Deps"
Cohesion: 0.06
Nodes (31): devDependencies, eslint, eslint-config-next, @playwright/test, prisma, tailwindcss, @tailwindcss/postcss, tsx (+23 more)

### Community 7 - "Platform Domain Concepts"
Cohesion: 0.08
Nodes (28): Cigma Points Platform, Community Voting System, Point Request, Task Post, TypeScript Throughout Constraint, Uploadthing Storage Constraint, Vercel Hobby Tier Constraint, Admin Role (JWT Custom Claim) (+20 more)

### Community 8 - "Root Layout & Uploads"
Cohesion: 0.11
Nodes (13): inter, jetbrainsMono, metadata, viewport, Providers(), UploadButton, UploadDropzone, Header() (+5 more)

### Community 9 - "TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+12 more)

### Community 10 - "shadcn Components Config"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 11 - "Reply & Task Threads"
Cohesion: 0.15
Nodes (13): buildTree(), TaskThreadSection(), TaskThreadSectionProps, TaskReplyThread(), TaskReplyThreadProps, ReplyCompose(), ReplyComposeProps, buildTree() (+5 more)

### Community 12 - "Header & Dropdown UI"
Cohesion: 0.19
Nodes (10): PullToRefresh(), CpLogo(), DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator (+2 more)

### Community 13 - "Post Validation Schemas"
Cohesion: 0.25
Nodes (6): postRouter, valid, createPostSchema, castVoteSchema, deriveVoteState(), retractVoteSchema

### Community 14 - "CP Logo Concepts"
Cohesion: 0.44
Nodes (9): Cigma Points CP Monogram Brand Identity, Crimson/Rose Gradient Palette (#F43F5E to #7C1428), Concept 1 — Solid Filled CP Monogram on Rounded Tile, Concept 2 — Open-Ring CP with Rounded Terminals, Concept 3 — Monoline CP on Light Tile, Concept 4 — Solid Constant-Width Ring CP, Iteration 1 — Concept 3 Red on White, Iteration 2 — Color-Swapped White on Red (+1 more)

### Community 15 - "Settlement & Cron"
Cohesion: 0.32
Nodes (3): ExpiredPost, settlePost(), MockOp

### Community 20 - "PWA Icons"
Cohesion: 1.00
Nodes (4): Cigma Points CP Apple Touch Icon, Cigma Points CP Tile Icon (SVG), Cigma Points CP Icon (192px PWA), Cigma Points CP Icon (512px PWA)

### Community 22 - "NextAuth Types"
Cohesion: 0.50
Nodes (3): JWT, Session, User

## Knowledge Gaps
- **192 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+187 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Runtime Dependencies` to `tRPC Routers & Client`, `Build Tooling & Dev Deps`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `@trpc/client` connect `tRPC Routers & Client` to `Runtime Dependencies`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `Button` connect `Home Feed & Post Cards` to `Profile & Post Creation Forms`, `Reply & Task Threads`, `Header & Dropdown UI`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _198 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Home Feed & Post Cards` be split into smaller, more focused modules?**
  _Cohesion score 0.060764587525150904 - nodes in this community are weakly interconnected._
- **Should `Profile & Post Creation Forms` be split into smaller, more focused modules?**
  _Cohesion score 0.0797872340425532 - nodes in this community are weakly interconnected._
- **Should `tRPC Routers & Client` be split into smaller, more focused modules?**
  _Cohesion score 0.08181818181818182 - nodes in this community are weakly interconnected._