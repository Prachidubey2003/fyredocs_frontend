# Security Policy — Fyredocs Frontend

We take security of the Fyredocs platform seriously. This document describes how to report a vulnerability, our response process, and the supported branches.

## Reporting a vulnerability

**Do not open a public GitHub issue for security reports.**

Email **security@fyredocs.com** (alias: shivam.dubey@vcommission.com while the dedicated alias is being provisioned) with:

1. A clear description of the issue.
2. Steps to reproduce (proof-of-concept code or HTTP transcript welcome).
3. The affected commit SHA / version / deployed URL.
4. The impact you observed and any caveats.
5. Whether you have already disclosed this to a third party.

You can also use GitHub's [Private Security Advisories](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability) feature on this repository (the "Report a vulnerability" button on the *Security* tab).

## What to expect

| Step | Target time |
|---|---|
| Acknowledgement of your report | **within 2 business days** |
| Initial triage and severity assignment (CVSS v3.1) | within 5 business days |
| Status update cadence during investigation | every 7 days |
| Coordinated disclosure window for confirmed issues | up to 90 days from acknowledgement, negotiable |

## Scope

### In scope

- Any code under this repository (the React + Vite + TypeScript app).
- The deployed Fyredocs web app at the production URL.
- Client-side handling of authentication tokens, file uploads, and PDF rendering.

### Out of scope

- Third-party npm dependencies (please report to upstream; we will track via `npm audit` and Dependabot).
- Server-side issues — please use the backend repository's [SECURITY.md](https://github.com/<org>/fyredocs_backend/blob/main/SECURITY.md).
- Findings that require physical access, social engineering, or browser/extension issues outside our code.
- Reports generated solely by automated scanners with no demonstrated impact.
- Findings in test fixtures, demo content, or `*.example`/`storybook` files.

## Safe-harbor

We will not pursue legal action against researchers who:

- Make a good-faith effort to follow this policy.
- Do not exfiltrate or destroy data.
- Do not interrupt service for other users.
- Give us a reasonable opportunity to remediate before public disclosure.

## Supported versions

| Branch | Supported |
|---|---|
| `main` | ✅ — receives security patches |
| Tagged releases ≤ 6 months old | ✅ |
| Older tags | ❌ — upgrade |

## Defensive baseline (what's in CI)

Every push and PR runs through these gates (defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) and [`.github/workflows/security.yml`](.github/workflows/security.yml)):

- **ESLint** + **Prettier** — style + lint.
- **Vitest** — test suite.
- **npm audit** — high-severity check.
- **gitleaks** — secret scanning across the full git history.
- **CodeQL** — GitHub's default-CodeQL queries for JavaScript / TypeScript.
- **OSV-Scanner** — Open Source Vulnerability database (broader than `npm audit`).
- **SBOM (syft)** — SPDX SBOM uploaded as a 14-day artifact on every CI run.
- **Dependabot** — weekly grouped npm and GitHub-Actions updates.

## Acknowledgements

<!-- Add to this list as advisories are published. -->

_None yet._
