---
phase: 03-posts-feed
plan: 03
subsystem: ui
tags: [react, trpc, react-hook-form, zod, shadcn-dialog, uploadthing, tanstack-query]

requires:
  - phase: 03-01
    provides: tRPC createPost mutation, searchUsers query, createPostSchema
  - phase: 03-02
    provides: stub Create Post button on home page to replace, FeedList with onCreatePost prop, shadcn Dialog installed

provides:
  - UserAutocomplete: debounced searchUsers input with avatar dropdown (250ms, enabled guard)
  - CreatePostModal: shadcn Dialog with 6-field RHF form (Award/Deduct toggle, UserAutocomplete, title, explanation, CP amount, media upload)
  - CreatePostButton: thin wrapper rendering CreatePostModal
  - Home page: stub button replaced with real CreatePostButton

affects: [03-04]

tech-stack:
  added: []
  patterns: ["RHF + zodResolver with z.coerce.number() requires Resolver<T> cast", "useDebounce 250ms before tRPC query with enabled guard", "UploadButton config={{ cn }} prop required for Tailwind class merge"]

key-files:
  created:
    - src/components/feed/user-autocomplete.tsx
    - src/components/feed/create-post-modal.tsx
    - src/components/feed/create-post-button.tsx
  modified:
    - src/app/page.tsx

key-decisions:
  - "CreatePostButton is a thin wrapper around CreatePostModal — Dialog's own DialogTrigger provides the button UI"
  - "zodResolver cast to Resolver<CreatePostValues> needed because z.coerce.number() gives unknown input type"
  - "mediaUrl managed outside RHF state (separate useState) — UploadButton is not a controlled form field"
  - "onCreatePost not wired to FeedEmptyState yet — FeedList would need a prop; deferred as non-blocking (user can use top button)"

patterns-established:
  - "z.coerce.number() + zodResolver: cast resolver as Resolver<OutputType> to silence generic mismatch"
  - "UserAutocomplete: controlled via value/onChange props — caller owns userId, component owns display query"
  - "UploadButton config={{ cn }} pattern: import cn from @/lib/utils, pass as config prop"

requirements-completed: [POST-01, POST-02, POST-03]

duration: 20min
completed: 2026-06-17
---

# Plan 03-03: Create Post Modal Summary

**Full Create Post flow — UserAutocomplete, 6-field Dialog form with RHF/Zod, UploadButton, feed invalidation; POST-01/02/03 delivered**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-06-17T20:50:00Z
- **Completed:** 2026-06-17T21:10:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- `UserAutocomplete`: controlled input with 250ms debounce, `enabled` guard skips query until ≥1 char, avatar dropdown with click-to-select
- `CreatePostModal`: shadcn Dialog with all 6 fields in order — Award/Deduct toggle (variant swap), UserAutocomplete (via RHF Controller), title Input, explanation Textarea(rows=4), CP amount Input(type=number), optional UploadButton with `config={{ cn }}`; form resets on both close and success; feed invalidated via `queryClient.invalidateQueries(trpc.post.getFeed.queryFilter())`
- `CreatePostButton`: thin wrapper — returns `<CreatePostModal />` directly since the Dialog's own DialogTrigger provides the button
- Home page stub button replaced with `<CreatePostButton />`

## Task Commits

1. **Task 1: UserAutocomplete** — `3fe8809` (feat)
2. **Task 2: CreatePostModal** — `72a7342` (feat)
3. **Task 3: CreatePostButton + home page** — `5975288` (feat)

## Files Created/Modified

- `src/components/feed/user-autocomplete.tsx` — debounced searchUsers dropdown
- `src/components/feed/create-post-modal.tsx` — 6-field Dialog form
- `src/components/feed/create-post-button.tsx` — thin wrapper
- `src/app/page.tsx` — stub replaced with CreatePostButton

## Decisions Made

- `zodResolver(createPostSchema) as Resolver<CreatePostValues>`: `z.coerce.number()` gives the resolver an `unknown` input type for cpAmount, causing a generic mismatch with RHF's `TFieldValues`. Explicit cast resolves it cleanly without changing the schema.
- `FeedEmptyState.onCreatePost` not wired — would require threading a modal-open callback from page → FeedList → FeedEmptyState across a server/client boundary. The top-of-page Create Post button satisfies the requirement at MVP.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] zodResolver generic mismatch from z.coerce.number()**
- **Found during:** Task 2 (CreatePostModal TypeScript check)
- **Issue:** `zodResolver(createPostSchema)` inferred with `unknown` input type for cpAmount due to `z.coerce.number()`, causing assignment error to `useForm<CreatePostValues>` resolver slot
- **Fix:** Added `as Resolver<CreatePostValues>` cast on the zodResolver call; imported `type Resolver` from react-hook-form
- **Files modified:** src/components/feed/create-post-modal.tsx
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** `72a7342`

---

**Total deviations:** 1 auto-fixed (1 blocking type error)
**Impact on plan:** Cast is a standard fix for this z.coerce + RHF pattern. No scope creep.

## Issues Encountered

None beyond the resolver type fix above.

## Next Phase Readiness

- Wave 4 (Plan 03-04) can now write unit tests for `createPostSchema` and E2E tests for the full create-post flow
- `PostCard.mediaUrl` rendering ready to activate in 03-04

---
*Phase: 03-posts-feed*
*Completed: 2026-06-17*
