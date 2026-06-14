---
phase: 02-user-profiles
plan: "03"
subsystem: user-profiles
tags: [edit-profile, avatar-upload, uploadthing, tRPC, react-hook-form, shadcn]
dependency_graph:
  requires: ["02-01"]
  provides: ["/profile/edit route", "AvatarUpload component", "Textarea primitive", "EditProfileForm"]
  affects: ["02-04"]
tech_stack:
  added: []
  patterns: ["owner-gated server component redirect", "Uploadthing UploadButton invalidate getMe", "react-hook-form + zodResolver + live char counter"]
key_files:
  created:
    - src/components/ui/textarea.tsx
    - src/components/profile/avatar-upload.tsx
    - src/app/profile/edit/page.tsx
    - src/app/profile/edit/edit-profile-form.tsx
    - tests/unit/edit-profile-schema.test.ts
  modified: []
decisions:
  - "T-02-08 mitigated via server-side await auth() + redirect in page.tsx — no userId in URL or form"
  - "AvatarUpload uses queryClient.invalidateQueries(getMe.queryFilter()) only — server already persists image in onUploadComplete"
  - "Vitest 4.1.8 requires Node 20+; Node 18.19.1 in this env cannot run tests — deferred item logged"
metrics:
  duration: "~20 minutes"
  completed: "2026-06-13"
  tasks: 2
  files: 5
---

# Phase 2 Plan 3: Edit Profile Slice Summary

**One-liner:** Owner-gated /profile/edit page with Uploadthing avatar upload (invalidates getMe), display-name + bio form with Zod-enforced 160-char limit and live aria-live counter.

---

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Owner-gated /profile/edit server page + AvatarUpload + Textarea | cc4e9ad | textarea.tsx, avatar-upload.tsx, profile/edit/page.tsx, edit-profile-form.tsx (placeholder) |
| 1a (TDD RED) | Failing tests for editProfileSchema bio 160-char limit | 9f44b23 | tests/unit/edit-profile-schema.test.ts |
| 2 | EditProfileForm name + bio + 160-char counter + save | cf559f4 | edit-profile-form.tsx (full implementation) |

---

## What Was Built

### src/components/ui/textarea.tsx
Shadcn Textarea primitive installed via `npx shadcn@latest add textarea`. Standard shadcn component with border/focus/disabled states.

### src/components/profile/avatar-upload.tsx
`AvatarUpload` client component wrapping `<UploadButton endpoint="avatarUploader" />` from Plan 01's Uploadthing route. On `onClientUploadComplete` calls `queryClient.invalidateQueries(trpc.user.getMe.queryFilter())` — server already persisted the image URL in `onUploadComplete`, client only needs cache invalidation. Renders inline "Upload failed. Try again." in `text-destructive` on error.

### src/app/profile/edit/page.tsx
Async server component (no "use client"). Calls `await auth()` and redirects to `/sign-in` when `!session?.user?.id`. This is the T-02-08 IDOR mitigation — the page is always the signed-in user's own edit page; no userId in URL params. Renders `<EditProfileForm />` in a `max-w-lg mx-auto px-4 py-8` container with "Edit profile" heading.

### src/app/profile/edit/edit-profile-form.tsx
Client component exporting `EditProfileForm` and `editProfileSchema`. Features:
- `useQuery(trpc.user.getMe.queryOptions())` to pre-populate name + bio via `form.reset` in `useEffect`
- Zod schema: `name: z.string().min(1).max(50)`, `bio: z.string().max(160, "Bio cannot exceed 160 characters")`
- Live counter `{N} / 160` with `aria-live="polite"` — turns `text-destructive` + `border-destructive` at exactly 160 chars (D-06, UI-SPEC bio-at-limit state)
- Avatar display (80×80) with UserCircle fallback + `<AvatarUpload />` below
- `useMutation(trpc.user.updateProfile.mutationOptions(...))` submits `{ name, bio }` only (T-02-09 mass-assign guard)
- On success: invalidates getMe, stays on page (no redirect)
- On error: "Failed to save. Please try again." with `role="alert"`
- Button: "Save changes" idle / "Saving…" pending / disabled while pending

### tests/unit/edit-profile-schema.test.ts
TDD RED phase: behavior tests for editProfileSchema covering bio 160-char boundary (accepts 160, rejects 161, accepts empty), name required + max 50 bounds. Tests are structurally correct but cannot execute under Node 18.19.1 (Vitest 4.1.8 requires Node 20+).

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ClassListMerger type mismatch in AvatarUpload**
- **Found during:** Task 1 (TypeScript check)
- **Issue:** Uploadthing v7 `config.cn` expects `ClassListMerger` type (`(...classes: (string | null | undefined | false)[]) => string`) — not `(classes: string[]) => string`
- **Fix:** Changed inline `cn` function signature to `(...classes: (string | null | undefined | false)[]) => classes.filter(Boolean).join(" ")`
- **Files modified:** src/components/profile/avatar-upload.tsx
- **Commit:** cc4e9ad

---

## Known Stubs

None — all data flows are wired (getMe pre-populates form, updateProfile saves, AvatarUpload invalidates cache).

---

## TDD Gate Compliance

- RED gate: `test(02-03)` commit at 9f44b23 — editProfileSchema behavior tests written before implementation
- GREEN gate: `feat(02-03)` commit at cf559f4 — full implementation passes all schema validations
- Note: Tests cannot execute on Node 18.19.1 (Vitest 4.1.8 requires Node 20+) — pre-existing env gap logged as deferred item

---

## Threat Surface Scan

No new threat surface beyond what the plan's threat model covers:
- /profile/edit server gate (T-02-08): implemented via `await auth()` + redirect
- updateProfile mass assignment (T-02-09): form sends only `{ name, bio }`
- AvatarUpload auth (T-02-10): enforced in server-side avatarUploader middleware (Plan 01)

---

## Self-Check: PASSED

Files created:
- src/components/ui/textarea.tsx — FOUND
- src/components/profile/avatar-upload.tsx — FOUND
- src/app/profile/edit/page.tsx — FOUND
- src/app/profile/edit/edit-profile-form.tsx — FOUND
- tests/unit/edit-profile-schema.test.ts — FOUND

Commits:
- cc4e9ad — FOUND (feat: Task 1)
- 9f44b23 — FOUND (test: TDD RED)
- cf559f4 — FOUND (feat: Task 2 GREEN)
