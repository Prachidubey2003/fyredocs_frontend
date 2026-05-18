import { expect, test } from "@playwright/test";

import { minimalPdf } from "./fixtures/minimal-pdf";

/**
 * Upload + convert flow — requires a running backend.
 *
 * This walks an authenticated user through the golden path called out in
 * plan §9.1: upload → convert → download URL appears.
 *
 * Set `FYREDOCS_E2E_BACKEND` to enable; otherwise tests skip.
 */

const backendURL = process.env.FYREDOCS_E2E_BACKEND;

test.describe("upload + convert flow (backend-dependent)", () => {
  test.beforeEach((_fixtures, testInfo) => {
    if (!backendURL) {
      testInfo.skip(
        true,
        "FYREDOCS_E2E_BACKEND not set — backend-dependent test skipped",
      );
    }
  });

  test("pdf-to-word: upload a minimal PDF, convert, see a download trigger", async ({
    page,
  }) => {
    // --- Signup + signin (ephemeral user per test) ---
    const stamp = Date.now();
    const email = `e2e+upload+${stamp}@fyredocs.test`;
    const password = "CorrectHorse-Battery-Staple-7!";

    await page.goto("/signup");
    await page.locator('input[name="fullName"]').fill("E2E Upload");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="country"]').fill("Testlandia");
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);
    await page.getByRole("button", { name: /Create account/i }).click();
    await expect(page).not.toHaveURL(/\/signup$/, { timeout: 15_000 });

    // --- Navigate to the tool ---
    await page.goto("/pdf-to-word");
    await expect(page).toHaveURL(/\/pdf-to-word$/);

    // --- Upload the synthetic PDF ---
    // ConvertTool wraps a FileDropzone that contains an <input type="file"/>.
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: "minimal.pdf",
      mimeType: "application/pdf",
      buffer: minimalPdf(),
    });

    // --- Trigger conversion ---
    // Button text reads "Convert 1 file" / "Convert {N} files" depending on
    // count; match the prefix.
    const convertBtn = page.getByRole("button", { name: /^Convert/i });
    await expect(convertBtn).toBeVisible({ timeout: 10_000 });
    await convertBtn.click();

    // --- Wait for completion ---
    // The backend's free-tier PDF→DOCX takes a few seconds. We watch for
    // either:
    //   (a) a "Download" link / button appearing, or
    //   (b) the URL containing a job-id and a result panel.
    // Both are valid completion signals.
    await Promise.race([
      page.getByRole("link", { name: /Download/i }).waitFor({
        timeout: 60_000,
      }),
      page.getByRole("button", { name: /Download/i }).waitFor({
        timeout: 60_000,
      }),
    ]);

    // Sanity check: the page shouldn't be showing an error.
    await expect(page.locator("body")).not.toContainText(
      /failed|error/i,
      { timeout: 1_000 },
    );
  });
});
