export type JwtPayload = {
  sub?: string;
  exp?: number;
  iat?: number;
  role?: string;
  scope?: string[] | string;
  [key: string]: unknown;
};

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
};

// Decoding is for UX only; do not treat decoded claims as authoritative.
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
