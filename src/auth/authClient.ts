import { clearAccessToken, getAccessToken, setAccessToken } from '@/auth/tokenStore';
import { decodeJwt, isTokenExpired, JwtPayload } from '@/auth/jwtUtils';
import { AuthError, parseAuthError } from '@/auth/authErrors';

export type AuthUser = {
  id: string;
  email?: string;
  fullName?: string;
  country?: string;
  phone?: string;
  image?: string;
  role?: string;
  scope?: string[] | string;
  [key: string]: unknown;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthSignupCredentials = AuthCredentials & {
  fullName: string;
  country: string;
  phone?: string;
  image?: string;
};

type AuthResponse = Record<string, unknown> | null;

const DEFAULT_API_BASE_URL = 'http://localhost:8080';

const getBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
  return envUrl.trim().length > 0 ? envUrl : DEFAULT_API_BASE_URL;
};

const normalizeBaseUrl = (baseUrl: string) =>
  baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

const buildAuthUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizeBaseUrl(getBaseUrl())}${normalizedPath}`;
};

const parseResponseBody = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }
  const text = await response.text().catch(() => '');
  return text ? { message: text } : null;
};

const extractAccessToken = (data: AuthResponse) => {
  if (!data || typeof data !== 'object') return undefined;
  return (
    (data.accessToken as string | undefined) ??
    (data.access_token as string | undefined) ??
    (data.token as string | undefined) ??
    (data.AccessToken as string | undefined)
  );
};

const normalizeUser = (data: AuthResponse, token?: string): AuthUser | null => {
  if (!data || typeof data !== 'object') return null;
  const raw =
    (data.user as Record<string, unknown> | undefined) ??
    (data.profile as Record<string, unknown> | undefined) ??
    data;
  if (!raw || typeof raw !== 'object') return null;

  const id = (raw.id ?? raw.userId ?? raw.sub) as string | number | undefined;
  const payload = token ? decodeJwt<JwtPayload>(token) : null;
  const resolvedId = id ?? payload?.sub;

  if (!resolvedId) return null;

  return {
    ...raw,
    id: String(resolvedId),
    email: (raw.email as string | undefined) ?? (payload?.email as string | undefined),
    role: (raw.role as string | undefined) ?? payload?.role,
    scope: (raw.scope as string[] | string | undefined) ?? payload?.scope,
  };
};

const authRequest = async (
  path: string,
  options: RequestInit = {},
  withAuth = false
) => {
  const headers = new Headers(options.headers);
  if (withAuth) {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildAuthUrl(path), {
    credentials: 'include',
    ...options,
    headers,
  });

  if (!response.ok) {
    throw await parseAuthError(response);
  }

  return parseResponseBody(response);
};

// Prevents parallel refresh requests from racing and overwriting tokens.
let refreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(buildAuthUrl('/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status >= 500) {
          throw await parseAuthError(response);
        }
        clearAccessToken();
        return null;
      }

      const data = await parseResponseBody(response);
      const token = extractAccessToken(data);
      if (!token) {
        clearAccessToken();
        return null;
      }
      setAccessToken(token);
      return token;
    } catch {
      clearAccessToken();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const login = async (credentials: AuthCredentials) => {
  const data = await authRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  const token = extractAccessToken(data);
  if (!token) {
    throw new AuthError('SERVER_ERROR', 'No access token returned from server.');
  }

  setAccessToken(token);
  return {
    accessToken: token,
    user: normalizeUser(data, token),
  };
};

export const signup = async (credentials: AuthSignupCredentials) => {
  const data = await authRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  const token = extractAccessToken(data);
  if (!token) {
    throw new AuthError('SERVER_ERROR', 'No access token returned from server.');
  }

  setAccessToken(token);
  return {
    accessToken: token,
    user: normalizeUser(data, token),
  };
};

export const getProfile = async () => {
  const data = await authRequest('/auth/profile', { method: 'GET' }, true);
  const token = getAccessToken();
  const user = normalizeUser(data, token ?? undefined);
  if (!user) {
    throw new AuthError('SERVER_ERROR', 'Invalid profile response.');
  }
  return user;
};

export const getMe = async () => {
  const currentToken = getAccessToken();
  const shouldRefresh = !currentToken || isTokenExpired(currentToken);

  if (shouldRefresh) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      throw new AuthError('UNAUTHORIZED', 'Session expired.');
    }
  }

  try {
    const data = await authRequest('/auth/me', { method: 'GET' }, true);
    const token = getAccessToken();
    const user = normalizeUser(data, token ?? undefined);
    if (!user) {
      throw new AuthError('SERVER_ERROR', 'Invalid user response.');
    }
    return user;
  } catch (error) {
    if (error instanceof AuthError && error.status === 401) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        throw error;
      }
      const data = await authRequest('/auth/me', { method: 'GET' }, true);
      const token = getAccessToken();
      const user = normalizeUser(data, token ?? undefined);
      if (!user) {
        throw new AuthError('SERVER_ERROR', 'Invalid user response.');
      }
      return user;
    }
    throw error;
  }
};

export const logout = async () => {
  try {
    await authRequest('/auth/logout', { method: 'POST' }, true);
  } finally {
    clearAccessToken();
  }
};
