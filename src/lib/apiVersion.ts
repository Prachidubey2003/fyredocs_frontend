/**
 * API version namespacing.
 *
 * The gateway serves every route under BOTH the legacy unversioned prefixes
 * (`/api/jobs`, `/auth/login`, `/admin/...`) and a canonical versioned root
 * (`/api/v1/...`). Call sites keep using the legacy spelling; this helper
 * rewrites it at the single point where a URL is built, so migrating the whole
 * client is one flag rather than hundreds of string edits.
 *
 * Set `VITE_API_VERSION_PREFIX=''` to fall back to the legacy paths (useful when
 * pointing a dev build at an older gateway that has no /api/v1 aliases yet).
 */

const DEFAULT_VERSION_PREFIX = '/api/v1';

const getVersionPrefix = () => {
  const configured = import.meta.env.VITE_API_VERSION_PREFIX as string | undefined;
  // `undefined` (unset) → default; an explicitly empty string → opt out.
  return configured === undefined ? DEFAULT_VERSION_PREFIX : configured.trim();
};

/**
 * Rewrites a legacy API path onto the versioned root:
 *   /api/jobs/123   → /api/v1/jobs/123
 *   /auth/login     → /api/v1/auth/login
 *   /admin/metrics  → /api/v1/admin/metrics
 *
 * Absolute URLs, already-versioned paths, and non-API paths (e.g. the Caddy
 * object routes `/outputs/...`) are returned untouched.
 */
export const versionPath = (path: string): string => {
  const prefix = getVersionPrefix();
  if (!prefix) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized.startsWith(`${prefix}/`) || normalized === prefix) return normalized;

  if (normalized.startsWith('/api/')) return `${prefix}${normalized.slice('/api'.length)}`;
  if (normalized === '/api') return prefix;
  if (normalized === '/auth' || normalized.startsWith('/auth/')) return `${prefix}${normalized}`;
  if (normalized === '/admin' || normalized.startsWith('/admin/')) return `${prefix}${normalized}`;

  return normalized;
};
