/**
 * Client-side JWT decoding for display purposes only.
 *
 * Nothing in this file verifies a signature, so a decoded claim proves nothing —
 * it is whatever the token's bearer put there. Use it to show a role in the UI or
 * read an expiry for a countdown; never to decide what a user may do. Every real
 * authorization check happens server-side.
 *
 * Note the app's own session tokens are HttpOnly and cannot be read from
 * JavaScript at all (see src/auth/authContext.tsx), so these helpers only apply
 * to a token the app has been handed explicitly.
 */
export type JwtPayload = {
  sub?: string;
  exp?: number;
  iat?: number;
  role?: string;
  scope?: string[] | string;
  [key: string]: unknown;
};

/**
 * Decode base64url, which JWTs use instead of standard base64: `-` and `_`
 * replace `+` and `/`, and the `=` padding is stripped. atob rejects both
 * differences, hence the normalization and re-padding.
 */
const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
};

/**
 * Decode a JWT's payload without verifying it.
 *
 * NOT AUTHORITATIVE. The signature is not checked, so the returned claims are
 * attacker-controlled if the token is. Safe uses are cosmetic; unsafe uses are
 * anything that grants access. This doc comment is deliberately on the export so
 * the warning appears on hover at every call site.
 *
 * Returns null for anything unusable — absent token, too few segments, undecodable
 * or non-JSON payload — so callers handle one failure case instead of catching.
 */
export const decodeJwt = <T = JwtPayload>(token?: string): T | null => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const json = decodeBase64Url(parts[1]);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
};

/**
 * Read the `exp` claim as a JS timestamp (the claim is in seconds; JS uses
 * milliseconds). Unverified, like everything here — see decodeJwt.
 */
export const getJwtExpiry = (token?: string) => {
  const payload = decodeJwt<JwtPayload>(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
};

export const isTokenExpired = (token?: string, leewaySeconds = 30) => {
  const expiry = getJwtExpiry(token);
  if (!expiry) return false;
  return Date.now() >= expiry - leewaySeconds * 1000;
};
