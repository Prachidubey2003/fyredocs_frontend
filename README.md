# Fyredocs

## Project info

This repository contains the Fyredocs frontend.

## Development

```sh
# Install dependencies
npm i

# Start the development server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

## Tech stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## CI/CD

GitHub Actions runs lint, format check, tests, and build on every push and PR (`.github/workflows/ci.yml`), plus `npm audit`, `gitleaks` (config: [`.gitleaks.toml`](.gitleaks.toml)), and `syft` SBOM generation. Weekly dependency updates are managed by `.github/dependabot.yml` (npm packages grouped by ecosystem: Radix UI, TanStack, types, ESLint).

A separate `.github/workflows/security.yml` runs CodeQL (security-extended), OSV-Scanner, and OpenSSF Scorecard on every PR and weekly.

## Bundle-size budget

[`vite.config.ts`](vite.config.ts) splits node_modules into cache-stable vendor chunks (`react-vendor`, `radix-vendor`, `pdf-vendor`, `mermaid-vendor`, `charts-vendor`, `motion-vendor`) so a deploy that only touches app code doesn't bust the user's cached library bytes. Shiki's per-language grammars stay as independent dynamic chunks (each ≤ ≈800KB, route-lazy via `await codeToHtml({lang})`).

CI runs `npm run build:ci` which combines `vite build` with [`scripts/check-bundle-size.mjs`](scripts/check-bundle-size.mjs) — a pure-Node script that asserts every named vendor family stays under its measured-plus-headroom budget, and that no single dynamic chunk exceeds the 850KB per-file ceiling. Bumping a budget is a deliberate edit to the `BUDGETS` map in that script (with a comment about why); the local run is `npm run bundle-budget` against an existing `dist/`.

## Rendering engine

The PDF viewer uses Mozilla `pdfjs-dist` today. The product plan calls for PDFium-WASM long-term for server/client pixel parity. See [`docs/RENDERING.md`](docs/RENDERING.md) for the renderer-strategy decision: why we stay on pdf.js for Phase 1, the migration prerequisites, and the triggers that flip the decision.

## End-to-end tests

Playwright specs live in [`e2e/`](e2e/). Two modes:

- **Smoke** (default, no backend) — `npm run e2e`. Runs on every PR via [`.github/workflows/e2e.yml`](.github/workflows/e2e.yml).
- **Full** (auth + upload + convert) — `FYREDOCS_E2E_BACKEND=http://localhost:8080 npm run e2e`. Opt-in via the `E2E_BACKEND_URL` repo variable in CI.

See [`e2e/README.md`](e2e/README.md) for the operator's guide, fixture conventions, and how to add a new test.

## Security

See [`SECURITY.md`](SECURITY.md) for the vulnerability-disclosure policy and CI security gates. Report privately to security@fyredocs.com or via GitHub Private Security Advisories.
