import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for fyredocs_frontend E2E tests.
 *
 * Modes:
 *   - **Frontend-only smoke** (default): tests in `e2e/smoke.spec.ts` run
 *     against the built Vite preview without a real backend. Routes that
 *     would hit the API are not exercised.
 *   - **Full E2E**: set `FYREDOCS_E2E_BACKEND=http://localhost:8080` (or the
 *     URL of any running backend) before invoking. Tests in `auth.spec.ts`
 *     and `upload-convert.spec.ts` will run; they would skip otherwise.
 *
 * See `e2e/README.md` for the operator's guide.
 */

const port = Number(process.env.PLAYWRIGHT_FRONTEND_PORT ?? 4173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const backendURL = process.env.FYREDOCS_E2E_BACKEND ?? "";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    // Surface the backend URL so tests can decide whether to skip.
    // (Use `process.env.FYREDOCS_E2E_BACKEND` inside specs.)
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Add firefox / webkit when the test suite stabilises — keeping the
    // matrix narrow for now to keep CI fast and signal high.
  ],
  // Auto-start the Vite preview server when we're not pointing at an
  // externally hosted instance. If PLAYWRIGHT_BASE_URL is set we assume the
  // server is already up.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npm run preview -- --port ${port} --strictPort`,
        url: `http://127.0.0.1:${port}`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        stdout: "pipe",
        stderr: "pipe",
      },
  metadata: {
    backendURL: backendURL || "(none — backend-dependent tests will be skipped)",
  },
});
