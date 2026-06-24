# Graph Report - .  (2026-06-24)

## Corpus Check
- 2 files · ~33,593 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 462 nodes · 755 edges · 40 communities (21 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Profile & Post Creation UI|Profile & Post Creation UI]]
- [[_COMMUNITY_tRPC Router Layer|tRPC Router Layer]]
- [[_COMMUNITY_Auth Actions & Feed|Auth Actions & Feed]]
- [[_COMMUNITY_Feed & Post Card Display|Feed & Post Card Display]]
- [[_COMMUNITY_npm Dependencies|npm Dependencies]]
- [[_COMMUNITY_DB, Settlement & Auth Helpers|DB, Settlement & Auth Helpers]]
- [[_COMMUNITY_Dev Tooling & Config|Dev Tooling & Config]]
- [[_COMMUNITY_Admin Panel UI|Admin Panel UI]]
- [[_COMMUNITY_Domain Model & Stack Decisions|Domain Model & Stack Decisions]]
- [[_COMMUNITY_App Layout & Providers|App Layout & Providers]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Component Aliases & Shadcn|Component Aliases & Shadcn]]
- [[_COMMUNITY_Post Router & Tests|Post Router & Tests]]
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

## Communities (40 total, 19 thin omitted)

### Community 0 - "Profile & Post Creation UI"
Cohesion: 0.10
Nodes (32): EditProfileForm(), editProfileSchema, EditProfileValues, CreatePostValues, UserAutocomplete(), cn(), ClaimUsernameForm(), claimUsernameFormSchema (+24 more)

### Community 1 - "tRPC Router Layer"
Cohesion: 0.09
Nodes (25): @trpc/client, @trpc/server, adminRouter, AppRouter, replyRouter, taskRouter, userRouter, getQueryClient() (+17 more)

### Community 2 - "Auth Actions & Feed"
Cohesion: 0.12
Nodes (22): signUp(), SignUpResult, PostCardProps, VoteButtons(), VoteButtonsProps, TaskCardProps, formatRelativeTime(), TaskReplyCard() (+14 more)

### Community 3 - "Feed & Post Card Display"
Cohesion: 0.08
Nodes (18): formatRelativeTime(), PostCard(), CreatePostButton(), CreatePostModal(), FeedEmptyState(), FeedList(), FeedSkeleton(), HomeTabs() (+10 more)

### Community 4 - "npm Dependencies"
Cohesion: 0.06
Nodes (35): dependencies, @auth/prisma-adapter, @base-ui/react, bcryptjs, class-variance-authority, clsx, @hookform/resolvers, lucide-react (+27 more)

### Community 5 - "DB, Settlement & Auth Helpers"
Cohesion: 0.08
Nodes (10): globalForPrisma, ExpiredPost, settlePost(), UploadButton, UploadDropzone, { handlers, auth, signIn, signOut }, MockOp, f (+2 more)

### Community 6 - "Dev Tooling & Config"
Cohesion: 0.07
Nodes (29): devDependencies, eslint, eslint-config-next, @playwright/test, prisma, tailwindcss, @tailwindcss/postcss, tsx (+21 more)

### Community 7 - "Admin Panel UI"
Cohesion: 0.11
Nodes (18): AdminTabs(), AdminPage(), AdminUser, AdminUserTable(), AdminUserTableProps, TaskDetailPage(), requireAdmin(), requireSession() (+10 more)

### Community 8 - "Domain Model & Stack Decisions"
Cohesion: 0.08
Nodes (28): Cigma Points Platform, Community Voting System, Point Request, Task Post, TypeScript Throughout Constraint, Uploadthing Storage Constraint, Vercel Hobby Tier Constraint, Admin Role (JWT Custom Claim) (+20 more)

### Community 9 - "App Layout & Providers"
Cohesion: 0.12
Nodes (16): inter, jetbrainsMono, metadata, Providers(), Header(), DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem (+8 more)

### Community 10 - "TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+12 more)

### Community 11 - "Component Aliases & Shadcn"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 12 - "Post Router & Tests"
Cohesion: 0.27
Nodes (6): postRouter, valid, createPostSchema, castVoteSchema, deriveVoteState(), retractVoteSchema

### Community 13 - "Post Detail & Thread View"
Cohesion: 0.31
Nodes (5): buildTree(), ReplyThread(), ReplyThreadProps, ThreadSection(), ThreadSectionProps

### Community 19 - "NextAuth Type Augmentation"
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
- **Why does `@trpc/client` connect `tRPC Router Layer` to `npm Dependencies`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _183 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Profile & Post Creation UI` be split into smaller, more focused modules?**
  _Cohesion score 0.10460992907801418 - nodes in this community are weakly interconnected._
- **Should `tRPC Router Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.08562367864693446 - nodes in this community are weakly interconnected._
- **Should `Auth Actions & Feed` be split into smaller, more focused modules?**
  _Cohesion score 0.11932773109243698 - nodes in this community are weakly interconnected._
- **Should `Feed & Post Card Display` be split into smaller, more focused modules?**
  _Cohesion score 0.08235294117647059 - nodes in this community are weakly interconnected._