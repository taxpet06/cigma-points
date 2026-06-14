// Wave 0 scaffold — Plan 03 un-skips these once /u/[username] exists.
//
// PROF-01: User has a display name and avatar visible on posts and in the feed
// PROF-02: User can write a short bio (about text) on their profile
// PROF-03: User can view any other user's public profile showing their CP balance and post history

import { test, expect } from "@playwright/test"

test.describe("PROF-01: Display name and avatar visible on profile", () => {
  test.skip(
    true,
    "Wave 0 scaffold — Plan 03 un-skips once /u/[username] page and nav avatar are built"
  )
  test("authenticated user sees their display name and avatar on their profile page", async ({
    page,
  }) => {
    // Sign in first
    await page.goto("/sign-in")
    await page.getByLabel("Email").fill("test@example.com")
    await page.getByLabel("Password").fill("TestPassword123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL("/")

    // Navigate to own profile
    await page.goto("/u/testuser")
    await expect(page.getByRole("heading")).toBeVisible()
    // Avatar should be present in the nav header
    await expect(page.getByRole("navigation")).toBeVisible()
  })
})

test.describe("PROF-02: User can write and save a bio", () => {
  test.skip(
    true,
    "Wave 0 scaffold — Plan 03 un-skips once /profile/edit page with bio textarea is built"
  )
  test("user can navigate to edit profile page and save a bio up to 160 characters", async ({
    page,
  }) => {
    // Sign in first
    await page.goto("/sign-in")
    await page.getByLabel("Email").fill("test@example.com")
    await page.getByLabel("Password").fill("TestPassword123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL("/")

    // Navigate to edit profile
    await page.goto("/profile/edit")

    // Fill in bio
    const bio = "This is a test bio for the Cigma Points platform. It should appear on the profile."
    await page.getByLabel(/bio/i).fill(bio)
    await page.getByRole("button", { name: /save/i }).click()

    // Bio should be visible on profile page
    await page.goto("/u/testuser")
    await expect(page.getByText(bio)).toBeVisible()
  })
})

test.describe("PROF-03: Authenticated user can view another user's public profile", () => {
  test.skip(
    true,
    "Wave 0 scaffold — Plan 03 un-skips once /u/[username] page with CP balance and post history tabs is built"
  )
  test("authenticated user can view another user's profile with CP balance and post history tabs", async ({
    page,
  }) => {
    // Sign in
    await page.goto("/sign-in")
    await page.getByLabel("Email").fill("test@example.com")
    await page.getByLabel("Password").fill("TestPassword123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL("/")

    // Navigate to another user's profile
    await page.goto("/u/anotheruser")

    // CP balance should be visible
    await expect(page.getByText(/cigma points/i)).toBeVisible()

    // Post history tabs should be present
    await expect(page.getByRole("tab", { name: /sent/i })).toBeVisible()
    await expect(page.getByRole("tab", { name: /received/i })).toBeVisible()
  })
})
