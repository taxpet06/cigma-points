# Graph Report - /home/petros/Github/cigma-points  (2026-06-24)

## Corpus Check
- 26 files · ~39,228 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 497 nodes · 795 edges · 40 communities (20 shown, 20 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Feed & Post UI|Feed & Post UI]]
- [[_COMMUNITY_Profile & Edit Flow|Profile & Edit Flow]]
- [[_COMMUNITY_tRPC API Layer|tRPC API Layer]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_Auth & Database|Auth & Database]]
- [[_COMMUNITY_Design System & Principles|Design System & Principles]]
- [[_COMMUNITY_Dev Dependencies|Dev Dependencies]]
- [[_COMMUNITY_App Shell & Task Views|App Shell & Task Views]]
- [[_COMMUNITY_Product Domain Model|Product Domain Model]]
- [[_COMMUNITY_Admin Panel|Admin Panel]]
- [[_COMMUNITY_Root Layout & Fonts|Root Layout & Fonts]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_shadcn Component Aliases|shadcn Component Aliases]]
- [[_COMMUNITY_Settlement E2E Tests|Settlement E2E Tests]]
- [[_COMMUNITY_Voting E2E Tests|Voting E2E Tests]]
- [[_COMMUNITY_Feed E2E Tests|Feed E2E Tests]]
- [[_COMMUNITY_Thread E2E Tests|Thread E2E Tests]]
- [[_COMMUNITY_Admin Task E2E Tests|Admin Task E2E Tests]]
- [[_COMMUNITY_Auth Type Extensions|Auth Type Extensions]]
- [[_COMMUNITY_Auth Config & Middleware|Auth Config & Middleware]]
- [[_COMMUNITY_Admin Guard E2E Tests|Admin Guard E2E Tests]]
- [[_COMMUNITY_Auth E2E Tests|Auth E2E Tests]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_UI Framework Stack|UI Framework Stack]]
- [[_COMMUNITY_Dark Mode Design|Dark Mode Design]]
- [[_COMMUNITY_Route Exports|Route Exports]]
- [[_COMMUNITY_File Icon Asset|File Icon Asset]]
- [[_COMMUNITY_Globe Icon Asset|Globe Icon Asset]]
- [[_COMMUNITY_Next.js Logo Asset|Next.js Logo Asset]]
- [[_COMMUNITY_Vercel Platform|Vercel Platform]]
- [[_COMMUNITY_Vercel Logo Asset|Vercel Logo Asset]]
- [[_COMMUNITY_Window Icon Asset|Window Icon Asset]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 23 edges
2. `compilerOptions` - 16 edges
3. `Cigma Points Product` - 15 edges
4. `Button` - 14 edges
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
- **Core Point Transfer Flow: Nomination → Voting → Settlement** — product_point_nomination, product_voting_mechanism, product_auto_settlement [EXTRACTED 1.00]
- **Post Card Visual System: Card + Semantic Badges + Vote Buttons** — design_post_cards, design_semantic_badges, design_vote_buttons [EXTRACTED 1.00]
- **Semantic Outcome Color Set: Award + Deduct + Pending** — design_semantic_award_color, design_semantic_deduct_color, design_semantic_pending_color [EXTRACTED 1.00]

## Communities (40 total, 20 thin omitted)

### Community 0 - "Feed & Post UI"
Cohesion: 0.07
Nodes (35): PostCard(), PostCardProps, CreatePostButton(), CreatePostModal(), FeedEmptyState(), FeedList(), FeedSkeleton(), HomeTabs() (+27 more)

### Community 1 - "Profile & Edit Flow"
Cohesion: 0.08
Nodes (33): EditProfileForm(), editProfileSchema, EditProfileValues, CreatePostValues, UserAutocomplete(), ClaimUsernameForm(), claimUsernameFormSchema, ClaimUsernameValues (+25 more)

### Community 2 - "tRPC API Layer"
Cohesion: 0.09
Nodes (24): @trpc/server, adminRouter, AppRouter, postRouter, replyRouter, taskRouter, userRouter, createTRPCContext() (+16 more)

### Community 3 - "Runtime Dependencies"
Cohesion: 0.06
Nodes (35): dependencies, @auth/prisma-adapter, @base-ui/react, bcryptjs, class-variance-authority, clsx, @hookform/resolvers, lucide-react (+27 more)

### Community 4 - "Auth & Database"
Cohesion: 0.07
Nodes (12): signUp(), SignUpResult, globalForPrisma, ExpiredPost, settlePost(), UploadButton, UploadDropzone, { handlers, auth, signIn, signOut } (+4 more)

### Community 5 - "Design System & Principles"
Cohesion: 0.10
Nodes (34): Anti-Gamification Principle, Anti-Social-Media-Clone Principle, Brand Crimson Primary Color, Button Variants (Primary/Outline/Destructive/Ghost), Cigma Points Platform, Community Scoreboard Design North Star, Flat-by-Default Elevation System, Form Input / Field Style (+26 more)

### Community 6 - "Dev Dependencies"
Cohesion: 0.07
Nodes (29): devDependencies, eslint, eslint-config-next, @playwright/test, prisma, tailwindcss, @tailwindcss/postcss, tsx (+21 more)

### Community 7 - "App Shell & Task Views"
Cohesion: 0.10
Nodes (19): Providers(), @trpc/client, buildTree(), TaskThreadSectionProps, TaskReplyThread(), TaskReplyThreadProps, ReplyCompose(), ReplyComposeProps (+11 more)

### Community 8 - "Product Domain Model"
Cohesion: 0.08
Nodes (28): Cigma Points Platform, Community Voting System, Point Request, Task Post, TypeScript Throughout Constraint, Uploadthing Storage Constraint, Vercel Hobby Tier Constraint, Admin Role (JWT Custom Claim) (+20 more)

### Community 9 - "Admin Panel"
Cohesion: 0.14
Nodes (13): AdminTabs(), AdminPage(), AdminUser, AdminUserTable(), AdminUserTableProps, TaskDetailPage(), requireAdmin(), requireSession() (+5 more)

### Community 10 - "Root Layout & Fonts"
Cohesion: 0.11
Nodes (16): inter, jetbrainsMono, metadata, viewport, Header(), DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem (+8 more)

### Community 11 - "TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+12 more)

### Community 12 - "shadcn Component Aliases"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 18 - "Auth Type Extensions"
Cohesion: 0.50
Nodes (3): JWT, Session, User

## Knowledge Gaps
- **187 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+182 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Runtime Dependencies` to `tRPC API Layer`, `Dev Dependencies`, `App Shell & Task Views`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `@trpc/client` connect `App Shell & Task Views` to `Runtime Dependencies`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _193 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Feed & Post UI` be split into smaller, more focused modules?**
  _Cohesion score 0.07191961924907457 - nodes in this community are weakly interconnected._
- **Should `Profile & Edit Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.0783744557329463 - nodes in this community are weakly interconnected._
- **Should `tRPC API Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.08859357696567 - nodes in this community are weakly interconnected._
- **Should `Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._