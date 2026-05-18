import { expect, test } from "@playwright/test";

/**
 * Auth flow tests — require a running backend.
 *
 * Set `FYREDOCS_E2E_BACKEND=http://localhost:8080` (or wherever the api-gateway
 * lives) before running. Otherwise these tests skip cleanly.
 *
 * The Vite preview server proxies `/auth/*` and `/api/*` to whatever URL the
 * frontend was built against, BUT the preview server itself uses the same
 * `vite.config.ts` proxy targeting `http://localhost:8080`. So:
 *
 *   - If you run `make dev` in fyredocs_backend at localhost:8080, just run
 *     `FYREDOCS_E2E_BACKEND=http://localhost:8080 npm run e2e`.
 *   - If your backend is elsewhere, set `PLAYWRIGHT_BASE_URL` to a frontend
 *     that proxies to the right place.
 */

const backendURL = process.env.FYREDOCS_E2E_BACKEND;

test.describe("auth flow (backend-dependent)", () => {
  test.beforeEach((_fixtures, testInfo) => {
    if (!backendURL) {
      testInfo.skip(
        true,
        "FYREDOCS_E2E_BACKEND not set — backend-dependent test skipped",
      );
    }
  });

  test("signup → home; signin with same creds → home", async ({ page }) => {
    const stamp = Date.now();
    const email = `e2e+${stamp}@fyredocs.test`;
    const password = "CorrectHorse-Battery-Staple-7!";

    // --- Signup ---
    await page.goto("/signup");
    await page.locator('input[name="fullName"]').fill("E2E Tester");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="country"]').fill("Testlandia");
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);
    await page.getByRole("button", { name: /Create account/i }).click();

    // The app may route to /, /dashboard, or stay and show a toast — we just
    // assert we're off /signup, which is the contract.
    await expect(page).not.toHaveURL(/\/signup$/, { timeout: 15_000 });

    // Drop the session by clearing cookies, then sign back in.
    await page.context().clearCookies();

    // --- Signin ---
    await page.goto("/signin");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page).not.toHaveURL(/\/signin$/, { timeout: 15_000 });
  });

  test("signin with bogus creds stays on /signin and surfaces an error", async ({
    page,
  }) => {
    await page.goto("/signin");
    await page.locator('input[name="email"]').fill("no-such-user@fyredocs.test");
    await page.locator('input[name="password"]').fill("definitely-wrong-pw");
    await page.getByRole("button", { name: /Sign in/i }).click();

    // We don't assert on the exact error copy (toasts/alerts evolve) — we
    // assert that the URL stays on /signin and the submit button becomes
    // re-enabled (so the page handled the failure rather than hung).
    await expect(page).toHaveURL(/\/signin$/);
    await expect(
      page.getByRole("button", { name: /Sign in/i }),
    ).toBeEnabled({ timeout: 10_000 });
  });
});
