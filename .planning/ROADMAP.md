# Roadmap: Cigma Points

## Overview

Cigma Points ships in six vertical phases, each delivering a complete, testable user capability. Phase 1 lays the foundation (auth, schema, nav shell). Phases 2–5 build the core social loop — profiles, posts, voting with automatic settlement, and threaded replies. Phase 6 closes the loop with the admin panel and Task Post workflow. Every phase depends only on the phase before it, and every v1 requirement lands in exactly one phase.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation + Auth** - Project scaffold, Prisma schema, NextAuth v5, role middleware, layout/nav shell (completed 2026-06-13)
- [x] **Phase 2: User Profiles** - Display name, avatar via Uploadthing, bio, public profile page with CP balance + history (completed 2026-06-17)
- [x] **Phase 3: Posts + Feed** - Award/deduct post creation with media, public scrollable feed with post cards (completed 2026-06-17)
- [x] **Phase 4: Voting + Settlement** - Agree/disagree votes, vote counts, Vercel Cron settlement engine, outcome display (completed 2026-06-18)
- [ ] **Phase 5: Threads + Replies** - Threaded replies on all posts, media on replies, nested threading
- [ ] **Phase 6: Admin Panel + Tasks** - Admin user/balance table, Task Post creation, task reply review + CP award, Tasks tab

## Phase Details

### Phase 1: Foundation + Auth

**Goal**: Users can securely create accounts and log in; admin role is enforced throughout the app
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):

  1. A new user can sign up with email and password and land on the app
  2. A returning user can log in and their session persists across a browser refresh
  3. An admin user visiting any admin route is granted access; a regular user attempting the same is blocked
  4. The app renders a navigation shell (header, main content area) consistent across all pages

**Plans**: 4 plans
Plans:

- [x] 01-01-PLAN.md — Project scaffold + all Phase 1 deps + test infra + failing AUTH E2E specs
- [x] 01-02-PLAN.md — Prisma v7 schema + Neon config + [BLOCKING] db push + seed proof
- [x] 01-03-PLAN.md — NextAuth v5 (credentials, JWT role claim) + registration + admin middleware
- [x] 01-04-PLAN.md — tRPC v11 scaffold + user.getMe + nav shell + sign-in/sign-up/admin pages

### Phase 2: User Profiles

**Goal**: Users have a public identity — display name, avatar, bio — and any user can view another user's CP balance and post history
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: PROF-01, PROF-02, PROF-03
**Success Criteria** (what must be TRUE):

  1. A user's display name and avatar appear on their profile page and on any content they author
  2. A user can write and save a short bio that is visible on their public profile
  3. Any authenticated user can visit another user's profile and see their current CP balance and post history

**Plans**: 4 plans
Plans:
**Wave 1**

- [x] 02-01-PLAN.md — username migration + tRPC procedures (claim/update/get profile, post history) + Uploadthing route

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — shared PostCard component + Sent/Received post-history tabs
- [x] 02-03-PLAN.md — /profile/edit (owner-gated) + avatar upload + bio editor with 160-char counter

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-04-PLAN.md — /u/[username] public profile + claim-username form + nav avatar wiring + E2E

**UI hint**: yes

### Phase 3: Posts + Feed

**Goal**: Users can create award and deduct posts with optional media, and all posts appear in a public scrollable feed ordered by recency
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: POST-01, POST-02, POST-03, POST-04
**Success Criteria** (what must be TRUE):

  1. A user can create an award post by selecting a target user, specifying a CP amount, and adding a title and explanation
  2. A user can create a deduct post using the same form fields
  3. A user can attach an image, video, or GIF to a post before submitting
  4. After submission, the post appears at the top of the public feed visible to all authenticated users

**Plans**: 4 plans
Plans:
**Wave 1**

- [x] 03-01-PLAN.md — createPostSchema + postRouter (createPost, getFeed, searchUsers) + postMediaUploader

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — shadcn dialog install + FeedList (useInfiniteQuery + IntersectionObserver) + FeedSkeleton + FeedEmptyState + home page replacement

**Wave 3** *(blocked on Wave 1 + Wave 2 completion)*

- [x] 03-03-PLAN.md — UserAutocomplete (debounced searchUsers) + CreatePostModal (Dialog + 6-field form + UploadButton) + CreatePostButton + wire into home page

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 03-04-PLAN.md — PostCard mediaUrl activation (img/video) + createPostSchema unit tests + E2E tests (POST-01, POST-02, POST-04)

**Cross-cutting constraints:**
- All three tRPC procedures are protectedProcedure — UNAUTHORIZED thrown before any DB access
- authorId always sourced from ctx.session.user.id, never from client input (createPost + postMediaUploader)
- Cache invalidation uses queryClient.invalidateQueries(trpc.post.getFeed.queryFilter()) — confirmed method name

**UI hint**: yes

### Phase 4: Voting + Settlement

**Goal**: Authenticated users can vote agree/disagree on posts, vote counts are visible, and an automatic cron job settles posts after the voting window closes — awarding or withholding points atomically
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: VOTE-01, VOTE-02, VOTE-03, VOTE-04
**Success Criteria** (what must be TRUE):

  1. An authenticated user can cast one agree or one disagree vote on any post they did not author, and cannot vote twice on the same post
  2. Agree and disagree vote counts are visible on every post card in the feed
  3. After a post's voting window closes, the Vercel Cron job settles it: if agrees exceed disagrees the target user's CP balance is updated; otherwise the request is rejected
  4. Settled post cards display either "Awarded" or "Rejected" as their final outcome

**Plans**: TBD

### Phase 5: Threads + Replies

**Goal**: Users can engage in threaded discussion on any award or deduct post, including media attachments and nested replies
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: THRD-01, THRD-02, THRD-03
**Success Criteria** (what must be TRUE):

  1. A user can reply to any award or deduct post and their reply appears in a thread beneath the post
  2. A user can attach an image, video, or GIF to a reply
  3. A user can reply to an existing reply, creating a nested thread (Twitter-style)

**Plans**: 3 plans
Plans:
**Wave 1**

- [ ] 05-01-PLAN.md — createReplySchema + replyRouter (createReply, getReplies) + _app.ts registration + reply-schema unit tests + failing threads E2E scaffold

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 05-02-PLAN.md — /post/[id] detail page + ReplyCard (recursive, 4-level indent cap) + ReplyThread (buildTree) + ReplyCompose (banner, media reuse, non-optimistic submit) — THRD-01/02/03 functional

**Wave 3** *(blocked on Wave 1 + Wave 2 completion)*

- [ ] 05-03-PLAN.md — PostCard replyCount link activation (MessageSquare → /post/[id]) + threads E2E pass (THRD-01, THRD-03)

**UI hint**: yes

### Phase 6: Admin Panel + Tasks

**Goal**: Admins can manage user balances and create Task Posts; users can reply to tasks and admins can award CP for task completion; a dedicated Tasks tab surfaces task posts separately from the main feed
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: ADMN-01, ADMN-02, ADMN-03, TASK-01, TASK-02, TASK-03
**Success Criteria** (what must be TRUE):

  1. An admin can view all users with their current CP balances in a table and directly edit any balance
  2. An admin can create a Task Post with title, description, optional media, and optional CP reward amount
  3. A Task Post appears in a dedicated Tasks tab, separate from the main award/deduct feed
  4. A user can reply to a Task Post with text and any media attachment
  5. An admin can review a user's Task Post reply and mark it complete, triggering a CP award to that user; the reply then shows "Awarded" status

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + Auth | 4/4 | Complete   | 2026-06-13 |
| 2. User Profiles | 4/4 | Complete   | 2026-06-17 |
| 3. Posts + Feed | 4/4 | Complete   | 2026-06-17 |
| 4. Voting + Settlement | 4/4 | Complete    | 2026-06-18 |
| 5. Threads + Replies | 0/3 | Planned | - |
| 6. Admin Panel + Tasks | 0/TBD | Not started | - |
