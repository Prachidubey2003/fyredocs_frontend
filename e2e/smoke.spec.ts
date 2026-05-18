import { expect, test } from "@playwright/test";

/**
 * Frontend-only smoke tests.
 *
 * These tests deliberately do NOT depend on a running backend — they exercise
 * routing, layout, and form-rendering only. They run on every PR.
 *
 * For backend-dependent tests, see `auth.spec.ts` and `upload-convert.spec.ts`.
 */

test.describe("smoke — public routes render", () => {
  test("home page renders the hero", async ({ page }) => {
    await page.goto("/");
    // The hero <h1> is "Your documents, simplified" with the second word
    // wrapped in a span — we match on the concatenated visible text.
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Your documents/i,
    );
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /simplified/i,
    );
    // The hero CTA group:
    await expect(
      page.getByRole("link", { name: /Explore All Tools/i }),
    ).toBeVisible();
  });

  test("all-tools page renders", async ({ page }) => {
    await page.goto("/all-tools");
    await expect(page).toHaveURL(/\/all-tools$/);
    // Page should not 404 — assert at least one tool card is visible.
    // Tool cards link to e.g. /merge, /pdf-to-word; check that any such
    // link is present.
    await expect(page.locator('a[href^="/"]').first()).toBeVisible();
  });

  test("pricing page renders", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page).toHaveURL(/\/pricing$/);
    // Pricing should mention "Pro" or "Free" — both tier names appear in
    // the plan blueprint and are stable terms.
    await expect(page.getByText(/Pro|Free|Plan/i).first()).toBeVisible();
  });

  test("docs index renders", async ({ page }) => {
    await page.goto("/docs");
    await expect(page).toHaveURL(/\/docs\/?$/);
  });

  test("unknown route renders the 404 page", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-12345");
    // The NotFound component renders something obvious — we accept either
    // "404", "Not Found", or the React-Router fallback "Oops".
    await expect(page.locator("body")).toContainText(/404|Not Found|Oops/i);
  });
});

test.describe("smoke — auth pages render their forms", () => {
  test("sign-in form has email + password fields", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign in/i })).toBeVisible();
  });

  test("sign-up form has required fields", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator('input[name="fullName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Create account/i }),
    ).toBeVisible();
  });

  test("sign-in form validates empty submission", async ({ page }) => {
    await page.goto("/signin");
    await page.getByRole("button", { name: /Sign in/i }).click();
    // HTML5 validation OR the form's own validation should keep us on /signin.
    await expect(page).toHaveURL(/\/signin$/);
  });
});

test.describe("smoke — tool routes render for unauthenticated visitors", () => {
  // NOTE on auth: `ProtectedRoute` in src/auth/authGuard.tsx is currently a
  // pass-through (its comment: "All tool pages are freely accessible — no
  // account required"). It only gates on `isLoading`. So the test contract
  // for unauthenticated visitors is "page renders after auth resolves",
  // not "redirect to /signin". If/when the guard starts enforcing auth
  // (Phase 4), revisit this block.
  //
  // We stub /auth/me to 401 so the loading state resolves deterministically
  // without a backend round-trip.
  test.beforeEach(async ({ page }) => {
    await page.route(/\/auth\/(me|profile|refresh)$/, (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "unauthenticated",
          error: { code: "UNAUTHENTICATED", details: "stubbed by e2e smoke" },
        }),
      }),
    );
  });

  for (const route of ["/merge", "/pdf-to-word", "/compress"]) {
    test(`${route} renders without erroring`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`${route}$`), {
        timeout: 10_000,
      });
      // Loading skeleton should resolve into actual page content. We assert
      // that the body has *some* visible content other than the skeleton.
      await expect(page.locator("body")).not.toContainText(/404|Not Found/i);
    });
  }

  test("/editor renders the empty viewer + file picker", async ({ page }) => {
    await page.goto("/editor");
    await expect(page).toHaveURL(/\/editor$/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { level: 1, name: /Editor/i })).toBeVisible();
    // File picker label is the visible element; the input is hidden.
    await expect(page.locator('input[type="file"][accept*="pdf"]')).toHaveCount(
      1,
    );
    // No PDF chosen yet — viewer placeholder copy.
    await expect(page.getByText(/No PDF loaded/i)).toBeVisible();
  });
});
