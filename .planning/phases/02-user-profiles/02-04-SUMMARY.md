---
phase: 02-user-profiles
plan: "04"
subsystem: user-profiles
tags: [profile-page, nav-header, claim-username, e2e, playwright, NextAuth, tRPC]
dependency_graph:
  requires: ["02-01", "02-02", "02-03"]
  provides:
    - "/u/[username] public profile page"
    - "ClaimUsernameForm component"
    - "/u/[username]/not-found.tsx"
    - "Nav avatar profile link with UserCircle fallback"
    - "PROF-01/02/03 E2E tests passing"
  affects: []
tech_stack:
  added: []
  patterns:
    - "Next.js 15 async params (await params)"
    - "server component db.user.findUnique with explicit select (threat model)"
    - "notFound() for unknown usernames"
    - "TanStack Query invalidateQueries after claimUsername for nav update"
    - "isDirty guard on form.reset to prevent overwriting user input"
    - "page.reload() after NextAuth v5 server-action sign-up for SessionProvider re-hydration"
key_files:
  created:
    - src/app/u/[username]/page.tsx
    - src/app/u/[username]/not-found.tsx
    - src/components/profile/claim-username-form.tsx
  modified:
    - src/components/nav/header.tsx
    - src/app/profile/edit/page.tsx
    - src/components/profile/claim-username-form.tsx
    - src/app/profile/edit/edit-profile-form.tsx
    - tests/e2e/profile.spec.ts
decisions:
  - "Avatar fallback is UserCircle icon (no initials) per D-11 — consistent across nav, profile page, PostCard"
  - "Nav avatar is a Link separate from DropdownMenu — primary action is navigate, dropdown is for sign-out"
  - "ClaimUsernameForm invalidates getMe on success so nav href updates from /profile/edit to /u/[username] without page reload"
  - "EditProfileForm guards form.reset with isDirty check — prevents getMe re-populate overwriting user input"
  - "E2E signUp helper calls page.reload() after redirect — NextAuth v5 server actions do not auto-hydrate the client SessionProvider"
metrics:
  duration: "35 minutes"
  completed_date: "2026-06-17"
  tasks_completed: 2
  files_changed: 8
---

# Phase 2 Plan 4: Integrative Profile Viewing Slice Summary

Assembled the full user-visible profile experience by tying Plans 01-03 together: `/u/[username]` public profile page, `ClaimUsernameForm` for first-time username setup, not-found page, nav header avatar rewire, and all three E2E profile specs now passing.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Profile page + not-found + ClaimUsernameForm | d9635cb | src/app/u/[username]/page.tsx, not-found.tsx, src/components/profile/claim-username-form.tsx |
| 2 | Nav header avatar rewire + E2E profile spec | 7bfbe30, b58d84f | src/components/nav/header.tsx, tests/e2e/profile.spec.ts, src/app/profile/edit/page.tsx, src/components/profile/claim-username-form.tsx, src/app/profile/edit/edit-profile-form.tsx |

## Verification Results

- `npx tsc --noEmit` — exit 0
- `npx playwright test profile.spec.ts` — 3/3 passed (PROF-01, PROF-02, PROF-03)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed EditProfileForm resetting user input when getMe resolves late**
- **Found during:** Task 2 (E2E PROF-02 failure — bio not saved)
- **Issue:** `edit-profile-form.tsx` called `form.reset({ name, bio })` inside a `useEffect` keyed on `me`. If `getMe` resolved after the user had already started typing, the reset would overwrite their input, resulting in an empty bio being submitted.
- **Fix:** Added `!form.formState.isDirty` guard before `form.reset` — only pre-populates when the user hasn't started editing.
- **Files modified:** `src/app/profile/edit/edit-profile-form.tsx`
- **Commit:** 7bfbe30

**2. [Rule 2 - Missing] Added getMe cache invalidation after username claim**
- **Found during:** Task 2 (PROF-01 assertion that nav avatar updates after claim)
- **Issue:** `ClaimUsernameForm` performed `router.push(/u/[username])` without invalidating the `getMe` TanStack Query cache. The nav header would still show `href="/profile/edit"` on the new page because the cached `me.username` was still null.
- **Fix:** Added `await queryClient.invalidateQueries(trpc.user.getMe.queryFilter())` before `router.push` in `ClaimUsernameForm`.
- **Files modified:** `src/components/profile/claim-username-form.tsx`
- **Commit:** 7bfbe30

**3. [Rule 1 - Bug] Fixed E2E signUp helper using wrong button name selector**
- **Found during:** Task 2 (all E2E tests timing out at sign-up button)
- **Issue:** The Wave 0 profile spec scaffold and `auth.spec.ts` used `getByRole("button", { name: /sign up/i })` but the actual sign-up page button says "Create account".
- **Fix:** Updated `signUp` helper to use `getByRole("button", { name: /create account/i })`.
- **Files modified:** `tests/e2e/profile.spec.ts`
- **Commit:** 7bfbe30

**4. [Rule 1 - Bug] Added page.reload() after NextAuth v5 server-action sign-up**
- **Found during:** Task 2 (PROF-01: nav avatar "View your profile" not visible after sign-up)
- **Issue:** After `signIn()` is called inside a Next.js Server Action, NextAuth v5 sets the JWT cookie via a redirect, but the client-side `SessionProvider` doesn't pick up the new session without a page reload. `useSession()` remains `unauthenticated`, so the authenticated nav state (avatar link) never renders.
- **Fix:** Added `await page.reload()` + `waitForLoadState("networkidle")` in the E2E `signUp` helper after redirect.
- **Files modified:** `tests/e2e/profile.spec.ts`
- **Commit:** 7bfbe30

## Threat Model Compliance

All mitigations from the plan's threat register were applied:

| Threat | Mitigation | Status |
|--------|-----------|--------|
| T-02-11 (Info Disclosure — profile select) | Explicit select in db.user.findUnique (never password/email) | Applied |
| T-02-12 (Tampering — username path param) | Prisma parameterizes findUnique; unknown -> notFound() | Applied |
| T-02-13 (EoP — claimUsername) | usernameSchema regex + P2002 CONFLICT prevent takeover | Applied (Plan 01) |
| T-02-14 (Spoofing — nav avatar href) | href built from server's own getMe result, not client input | Applied |

## Known Stubs

None — all data sources are wired. CP balance, bio, avatar, and post history all render from live DB data.

## Self-Check: PASSED

- `src/app/u/[username]/page.tsx` — FOUND
- `src/app/u/[username]/not-found.tsx` — FOUND
- `src/components/profile/claim-username-form.tsx` — FOUND
- `src/components/nav/header.tsx` — FOUND (UserCircle, /u/ link, aria-label)
- `tests/e2e/profile.spec.ts` — FOUND (no test.skip)
- Commit d9635cb — FOUND (profile page, not-found, ClaimUsernameForm)
- Commit 7bfbe30 — FOUND (header rewire, E2E tests, form fixes)
- Commit b58d84f — FOUND (PROF-01 timeout fix)
- `npx tsc --noEmit` — exit 0
- `npx playwright test profile.spec.ts` — 3 passed
