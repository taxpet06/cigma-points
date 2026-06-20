# Requirements: Cigma Points

**Defined:** 2026-06-13
**Core Value:** Users can recognize and hold each other accountable through transparent, community-verified point transfers

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can create an account with email and password
- [x] **AUTH-02**: User can log in with email and password
- [ ] **AUTH-03**: User session persists across browser refresh (JWT-based via NextAuth v5)
- [x] **AUTH-04**: Admin vs regular user role is enforced throughout the app (JWT custom claim, Next.js middleware)

### Profiles

- [x] **PROF-01**: User has a display name and avatar visible on posts and in the feed
- [x] **PROF-02**: User can write a short bio (about text) on their profile
- [x] **PROF-03**: User can view any other user's public profile showing their CP balance and post history

### Posts & Feed

- [ ] **POST-01**: User can create an award post (select target user, specify CP amount, add title, add explanation)
- [ ] **POST-02**: User can create a deduct post (same fields as award post, requests CP removal)
- [ ] **POST-03**: User can attach media to posts (images, video, GIF) via Uploadthing
- [ ] **POST-04**: All posts appear in a public scrollable feed visible to all authenticated users, ordered by recency

### Voting & Settlement

- [x] **VOTE-01**: Authenticated user can cast one agree or one disagree vote per post (not their own)
- [x] **VOTE-02**: Agree and disagree vote counts are visible on post cards in the feed
- [x] **VOTE-03**: Vercel Cron (every 15 min) settles posts whose voting window has closed — if agrees > disagrees, points are awarded; otherwise rejected. Written as an atomic Prisma transaction.
- [x] **VOTE-04**: Settled posts display their final outcome (Awarded / Rejected) on the post card

### Threads & Replies

- [ ] **THRD-01**: User can reply to any award/deduct post in a thread
- [ ] **THRD-02**: User can attach media to replies (images, video, GIF) via Uploadthing
- [ ] **THRD-03**: User can reply to replies (nested threading, Twitter-style)

### Admin Panel

- [x] **ADMN-01**: Admin can view all users and their current CP balances in a table, and edit any balance directly
- [x] **ADMN-02**: Admin can create Task Posts (title, description, optional media, optional CP reward amount)
- [x] **ADMN-03**: Admin can review each user's reply to a Task Post and mark it complete, triggering CP award

### Tasks

- [x] **TASK-01**: Task Posts appear in a dedicated Tasks tab separate from the main award/deduct feed
- [x] **TASK-02**: Users can reply to Task Posts in threads with any media (same as regular thread replies)
- [x] **TASK-03**: Each Task Post shows the completion status of each user who replied (Pending / Awarded)

---

## v2 Requirements

### Authentication

- **AUTH-V2-01**: User receives email verification after signup (requires email service — Resend)
- **AUTH-V2-02**: User can reset password via email link
- **AUTH-V2-03**: User can log in with Google or GitHub (OAuth)

### Admin

- **ADMN-V2-01**: Admin can edit any user's username from the admin panel

### Notifications

- **NOTF-V2-01**: User receives in-app notification when their post is settled
- **NOTF-V2-02**: User receives in-app notification when someone votes on their post
- **NOTF-V2-03**: User receives email notification for post settlement (requires Resend)

### Feed

- **FEED-V2-01**: Real-time feed updates without manual refresh (WebSocket via Supabase Realtime or Ably)
- **FEED-V2-02**: User can filter feed (by status: pending/settled, by type: award/deduct)

### Safety

- **SAFE-V2-01**: Rate limiting on post creation and voting (Upstash Redis)
- **SAFE-V2-02**: User can report a post for review

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native mobile app | Web-only with responsive design; revisit if demand grows |
| Real-time WebSocket feed | TanStack Query polling sufficient for MVP; Supabase Realtime not in stack |
| Email verification in v1 | Adds email service dependency; not critical for MVP |
| Password reset in v1 | Deferred to v2; can manually reset via admin panel for now |
| Rich text editor | Plain text + media attachment covers v1 content needs |
| Admin username editing | Not selected for v1; deferred to v2 |
| Public user following/followers | Not a stated requirement; not a reputation-platform table stake |
| Likes/reactions on replies | Replies are informational; voting is only on top-level posts |
| Direct messaging | Out of product scope entirely |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Complete |
| PROF-01 | Phase 2 | Complete |
| PROF-02 | Phase 2 | Complete |
| PROF-03 | Phase 2 | Complete |
| POST-01 | Phase 3 | Pending |
| POST-02 | Phase 3 | Pending |
| POST-03 | Phase 3 | Pending |
| POST-04 | Phase 3 | Pending |
| VOTE-01 | Phase 4 | Complete |
| VOTE-02 | Phase 4 | Complete |
| VOTE-03 | Phase 4 | Complete |
| VOTE-04 | Phase 4 | Complete |
| THRD-01 | Phase 5 | Pending |
| THRD-02 | Phase 5 | Pending |
| THRD-03 | Phase 5 | Pending |
| ADMN-01 | Phase 6 | Complete |
| ADMN-02 | Phase 6 | Complete |
| ADMN-03 | Phase 6 | Complete |
| TASK-01 | Phase 6 | Complete |
| TASK-02 | Phase 6 | Complete |
| TASK-03 | Phase 6 | Complete |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-13*
*Last updated: 2026-06-13 after roadmap creation — all 24 v1 requirements mapped to phases 1–6*
