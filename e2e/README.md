# E2E tests (Playwright)

End-to-end tests for the Fyredocs frontend. Two modes:

| Mode | When it runs | What it covers |
|---|---|---|
| **Smoke** (default) | Every PR via [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml) | UI-only: routing, layout, form rendering, auth-protected redirects. No backend required. |
| **Full** | Opt-in locally; opt-in in CI by setting the `FYREDOCS_E2E_BACKEND` repo variable | Adds auth signup/login and the upload → convert → download golden path against a real backend. |

The split lets the frontend repo's CI stay self-contained while still letting an operator run the full journey when they have the backend stack up.

## Files

| Path | Purpose |
|---|---|
| [`smoke.spec.ts`](smoke.spec.ts) | UI-only smokes. Always runs. |
| [`auth.spec.ts`](auth.spec.ts) | Signup + signin. Skips unless `FYREDOCS_E2E_BACKEND` is set. |
| [`upload-convert.spec.ts`](upload-convert.spec.ts) | Authenticated upload → convert. Skips unless `FYREDOCS_E2E_BACKEND` is set. |
| [`fixtures/minimal-pdf.ts`](fixtures/minimal-pdf.ts) | Returns a hand-crafted minimal valid PDF as a `Buffer`. No on-disk fixture needed. |

## Run locally

### Smoke only (no backend)

```bash
npm run e2e:install   # one-time — installs the Chromium binary
npm run build         # Playwright will auto-start `vite preview` against ./dist
npm run e2e
```

### Full E2E (with backend)

Bring up the backend separately (in `fyredocs_backend/`):

```bash
# in fyredocs_backend/
docker compose -f deployment/docker-compose.yml up -d
# wait for `curl localhost:8080/healthz` to return 200
```

Then in `fyredocs_frontend/`:

```bash
FYREDOCS_E2E_BACKEND=http://localhost:8080 npm run e2e
```

### Interactive / debug mode

```bash
npm run e2e:ui                  # Playwright UI mode — step through, inspect DOM
PWDEBUG=1 npm run e2e -- smoke  # open the inspector
npm run e2e -- --headed         # watch the browser
```

## Environment variables

| Variable | Default | Effect |
|---|---|---|
| `PLAYWRIGHT_BASE_URL` | `http://127.0.0.1:4173` | Where to point the browser. Setting this disables Playwright's auto-managed `vite preview`. |
| `PLAYWRIGHT_FRONTEND_PORT` | `4173` | Port for the auto-started preview server. |
| `FYREDOCS_E2E_BACKEND` | _unset_ | Backend URL. Setting it enables backend-dependent specs. The URL is only used for skip-gating today — the frontend still talks to the backend via Vite's proxy (`vite.config.ts`). For end-to-end traffic to reach a remote backend you need to also point the proxy at it (set `VITE_API_BASE_URL` at build time, or use a custom `vite.config.ts` override). |
| `CI` | _unset_ | When set, Playwright enables retries (2), restricts workers (2), and forbids `.only`. |

## Why no auto-spun-up backend in CI

Spinning up the whole `docker-compose.yml` (api-gateway + 5 worker services + Postgres + Redis + NATS + LibreOffice + Ghostscript + Tesseract) in the **frontend** CI would:

- couple two repos in one CI job,
- pull every backend Docker image on every PR,
- inflate runtime by 5–10 minutes,
- mean every flaky backend test fails the frontend CI.

Instead:

1. The frontend CI runs **smoke** only (fast, deterministic).
2. The backend CI's `e2e` job (Phase 1, when the editor lands) will spin up the full stack and run the same Playwright specs against it. The specs live here; both CIs consume them.
3. Anyone with the stack running locally can run **full** mode in seconds.

## Adding a new test

1. If it doesn't depend on a backend, add it to `smoke.spec.ts` or a new sibling spec without the `backendURL` guard.
2. If it does, copy the `beforeEach` skip block from [`auth.spec.ts`](auth.spec.ts).
3. Prefer `getByRole`, `getByLabel`, and `[name="…"]` selectors over class names — the design system uses Tailwind utility classes which change frequently.
4. Avoid `waitForTimeout`. Use `expect(...).toBeVisible({ timeout })` or `expect.poll` instead.
5. Tests must be parallel-safe — generate unique emails / job ids per run (`Date.now()` is fine here; UUID overkill).

## CI artifacts

The HTML report and any failure traces (`trace.zip`, screenshots, videos) upload as the `playwright-report` artifact on every CI run. Open `index.html` in a browser to inspect failures.
