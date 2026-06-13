import { test, expect } from "@playwright/test"

/**
 * AUTH-04 E2E Test Suite — Admin Role Guard
 *
 * These tests are FAILING scaffolds (Nyquist validation).
 * They describe the exact behavior Plans 2-4 must make pass.
 *
 * AUTH-04: Admin vs regular user role is enforced throughout the app
 *
 * NOTE: These tests will fail until:
 *   - Plan 2 (Prisma schema + DB) creates the User model with role field
 *   - Plan 3 (NextAuth) copies role into the JWT via the jwt() callback
 *   - Plan 4 (middleware) enforces role in middleware.ts for /admin routes
 *   - A seeded admin user exists in the database (created during dev setup)
 */

// Regular user credentials (role: USER)
const REGULAR_USER = {
  email: "regular@example.com",
  password: "RegularPassword123!",
}

// Admin user credentials (role: ADMIN)
// This user must be seeded in the DB with role: ADMIN before running these tests
const ADMIN_USER = {
  email: "admin@example.com",
  password: "AdminPassword123!",
}

test.describe("AUTH-04: Admin route enforcement", () => {
  test("regular user is redirected away from /admin", async ({ page }) => {
    // Sign in as a regular USER
    await page.goto("/sign-in")
    await page.getByLabel("Email").fill(REGULAR_USER.email)
    await page.getByLabel("Password").fill(REGULAR_USER.password)
    await page.getByRole("button", { name: /sign in/i }).click()

    // Wait for successful sign-in redirect
    await expect(page).toHaveURL("/")

    // Attempt to navigate to the admin route
    await page.goto("/admin")

    // Expect redirect away from /admin — middleware blocks non-admin users
    // The middleware (middleware.ts Plan 4) redirects to "/" for non-ADMIN roles
    await expect(page).not.toHaveURL("/admin")
    await expect(page).toHaveURL("/")
  })

  test("admin user can access /admin page", async ({ page }) => {
    // Sign in as an ADMIN user
    await page.goto("/sign-in")
    await page.getByLabel("Email").fill(ADMIN_USER.email)
    await page.getByLabel("Password").fill(ADMIN_USER.password)
    await page.getByRole("button", { name: /sign in/i }).click()

    // Wait for successful sign-in redirect
    await expect(page).toHaveURL("/")

    // Navigate to the admin route
    await page.goto("/admin")

    // Admin user stays on /admin and sees the admin dashboard heading
    await expect(page).toHaveURL("/admin")
    await expect(
      page.getByRole("heading", { name: /admin/i })
    ).toBeVisible()
  })
})
