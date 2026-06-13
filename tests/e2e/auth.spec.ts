import { test, expect } from "@playwright/test"

/**
 * AUTH E2E Test Suite — AUTH-01, AUTH-02, AUTH-03
 *
 * These tests are FAILING scaffolds (Nyquist validation).
 * They describe the exact behavior Plans 2-4 must make pass.
 *
 * AUTH-01: User can sign up with email and password
 * AUTH-02: User can log in with email and password
 * AUTH-03: User session persists across browser refresh (JWT via NextAuth v5)
 *
 * NOTE: These tests will fail until:
 *   - Plan 2 (Prisma schema + DB) pushes the users table
 *   - Plan 3 (NextAuth) implements the credentials provider + authorize()
 *   - Plan 4 (Auth UI) builds the sign-up and sign-in pages with proper form labels
 */

// Test user credentials — these will be created during the signup test
const TEST_USER = {
  name: "Test User",
  email: `testuser-${Date.now()}@example.com`,
  password: "TestPassword123!",
}

test.describe("AUTH-01: User can sign up", () => {
  test("user can sign up with name, email, and password", async ({ page }) => {
    // Navigate to the sign-up page
    await page.goto("/sign-up")

    // Fill in the sign-up form using role/label-based queries
    // These match the labels Plan 4 will add to the SignUpForm component
    await page.getByLabel("Name").fill(TEST_USER.name)
    await page.getByLabel("Email").fill(TEST_USER.email)
    await page.getByLabel("Password").fill(TEST_USER.password)

    // Submit the form
    await page.getByRole("button", { name: /sign up/i }).click()

    // After successful signup, expect redirect to home page
    await expect(page).toHaveURL("/")

    // Expect a signed-in indicator — a user avatar or name in the header
    // The nav shell (Plan 4) will render the user's name or avatar when signed in
    await expect(page.getByRole("navigation")).toBeVisible()
  })
})

test.describe("AUTH-02: User can log in", () => {
  test("user can log in with email and password", async ({ page }) => {
    // Pre-condition: a user with TEST_USER credentials exists.
    // In the full test suite, this would be set up via a fixture or API call.
    // For the Nyquist scaffold, we navigate to sign-in directly.

    // Navigate to the sign-in page
    await page.goto("/sign-in")

    // Fill in the sign-in form using role/label-based queries
    // These match the labels Plan 4 will add to the SignInForm component
    await page.getByLabel("Email").fill(TEST_USER.email)
    await page.getByLabel("Password").fill(TEST_USER.password)

    // Submit the form
    await page.getByRole("button", { name: /sign in/i }).click()

    // After successful login, expect redirect to home page
    await expect(page).toHaveURL("/")
  })
})

test.describe("AUTH-03: Session persists across refresh", () => {
  test("session persists after page reload", async ({ page }) => {
    // Pre-condition: sign in first
    await page.goto("/sign-in")
    await page.getByLabel("Email").fill(TEST_USER.email)
    await page.getByLabel("Password").fill(TEST_USER.password)
    await page.getByRole("button", { name: /sign in/i }).click()

    // Wait for redirect to home
    await expect(page).toHaveURL("/")

    // Reload the page — session should persist via NextAuth JWT cookie
    await page.reload()

    // Still on home page (not redirected to sign-in)
    await expect(page).toHaveURL("/")

    // Still signed in — navigation should still be visible
    await expect(page.getByRole("navigation")).toBeVisible()
  })
})
