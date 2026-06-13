# Cigma Points

## What This Is

Cigma Points is a community-driven social media platform where users publicly nominate each other for point awards or deductions. Point requests are voted on by the community — agree/disagree — and settled automatically after a voting window closes. Admins can directly manage balances and post Task Posts that users complete to earn points.

## Core Value

Users can recognize and hold each other accountable through transparent, community-verified point transfers — the feed of point requests and their voting outcomes is the beating heart of the platform.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can sign up and log in with email/password
- [ ] User session persists; admin vs regular user roles are enforced
- [ ] User has a public profile showing their Cigma Point balance and post history
- [ ] User can create a point-award post (target user, CP amount, title, explanation, optional media)
- [ ] User can create a point-deduct post (same fields as award post)
- [ ] Posts appear in a public scrollable feed visible to all users
- [ ] Users can agree or disagree with any post (one vote per user per post)
- [ ] After the voting window closes, points are automatically awarded or withheld based on vote outcome
- [ ] Users can reply to posts in threads (text, images, video, GIFs)
- [ ] Admin can view and edit any user's CP balance and username directly in the database table
- [ ] Admin can create Task Posts visible in a dedicated Tasks tab
- [ ] Users can reply to Task Posts in threads with any media
- [ ] Admin can review each user's Task Post reply and manually award CP for completion

### Out of Scope

- Native mobile app — web-only with responsive design; revisit if user demand warrants it
- Real-time WebSocket feed — TanStack Query polling is sufficient for MVP; Supabase Realtime was considered but not chosen
- Email notifications — deferred to v2; add Resend when notification UX is prioritized
- Rate limiting — deferred until abuse is observed; Upstash Redis is the upgrade path
- Rich text editor for posts — plain text + media is sufficient for v1
- OAuth login (Google, GitHub) — email/password covers v1 auth needs

## Context

Stack fully decided in STACK.md (2026-06-13 fsd-lead session). Key decisions:
- **Next.js 15 App Router** — monorepo, SSR feed, Vercel deployment
- **Neon PostgreSQL + Prisma** — relational data model, Studio GUI for debugging
- **NextAuth v5** — JWT sessions with custom `role` claim for admin enforcement
- **tRPC + TanStack Query** — type-safe data fetching with optimistic voting UX
- **Tailwind + shadcn/ui** — modern, responsive UI with pre-built components
- **Uploadthing** — image/video/GIF uploads, Next.js native, 2GB free
- **Vercel Cron → API route** — vote settlement every 15 minutes, Prisma transaction
- **Vercel Hobby** — free hosting, 2 cron slots, automatic deploys from main

The vote settlement mechanism is the most architecturally sensitive component — it writes point balances atomically and must handle edge cases (ties, zero votes, negative balances) correctly.

## Constraints

- **Budget**: Free / near-free — every service must have a viable free tier at MVP scale
- **Platform**: Web-only, mobile-responsive (no native apps)
- **Language**: TypeScript throughout (enforced by stack decisions)
- **Hosting**: Vercel Hobby tier — 10s function timeout, 100GB bandwidth/month, 2 cron jobs
- **Storage**: Uploadthing 2GB free — sufficient for MVP, R2 upgrade path available
- **Team**: Solo developer — complexity budget is strict; avoid operational overhead

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Neon over Supabase | More control, no vendor lock-in on auth/storage | — Pending |
| Prisma over Drizzle | Ergonomic API, Studio GUI for balance debugging | — Pending |
| tRPC over REST | Type safety from DB model to UI component | — Pending |
| NextAuth v5 over Clerk | Free, open source, Prisma adapter, JWT role claims | — Pending |
| Uploadthing over R2 | Better Next.js DX; R2 is the storage backend upgrade path | — Pending |
| Vercel Cron over pg_cron | No Neon pg_cron setup required; HTTP cron sufficient for MVP | — Pending |
| TanStack Query polling over WebSockets | Avoids separate WS infrastructure; acceptable for MVP feed freshness | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-13 after initialization*
