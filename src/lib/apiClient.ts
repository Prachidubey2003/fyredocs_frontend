import { refreshAccessToken } from '@/auth/authClient';
import { getAccessToken } from '@/auth/tokenStore';
import { getAuthHeaders } from '@/lib/auth';

type ApiRequestOptions = RequestInit & {
  skipAuth?: boolean;
  skipRefresh?: boolean;
};

const DEFAULT_API_BASE_URL = 'http://localhost:8080';

const getBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
  return envUrl.trim().length > 0 ? envUrl : DEFAULT_API_BASE_URL;
};

const normalizeBaseUrl = (baseUrl: string) =>
  baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

const mergeHeaders = (source?: HeadersInit, overrides?: HeadersInit) => {
  const headers = new Headers(source);
  if (overrides) {
    const overrideHeaders = new Headers(overrides);
    overrideHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }
  return headers;
};

export const buildApiUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizeBaseUrl(getBaseUrl())}${normalizedPath}`;
};

const parseErrorMessage = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';
  let message = response.statusText || `Request failed with ${response.status}`;

  if (contentType.includes('application/json')) {
    const data = await response.json().catch(() => null);
    if (data?.error) {
      message = data.error;
    } else if (data?.message) {
      message = data.message;
    }
  } else {
    const text = await response.text().catch(() => '');
    if (text) {
      message = text;
    }
  }

  return message;
};

export const buildAuthHeaders = (headers: Headers, skipAuth?: boolean) => {
  if (skipAuth) return headers;
  const token = getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const extraHeaders = getAuthHeaders();
  Object.entries(extraHeaders).forEach(([key, value]) => {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  });
  return headers;
};

export const apiRequest = async <T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const { skipAuth, skipRefresh, ...fetchOptions } = options;
  let headers = buildAuthHeaders(new Headers(fetchOptions.headers), skipAuth);
  let response = await fetch(buildApiUrl(path), {
    credentials: fetchOptions.credentials ?? 'include',
    ...fetchOptions,
    headers,
  });

  if (response.status === 401 && !skipRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers = buildAuthHeaders(new Headers(fetchOptions.headers), skipAuth);
      response = await fetch(buildApiUrl(path), {
        credentials: fetchOptions.credentials ?? 'include',
        ...fetchOptions,
        headers,
      });
    }
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  const text = await response.text();
  return text as unknown as T;
};

export const apiJson = async <T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const headers = mergeHeaders(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return apiRequest<T>(path, {
    ...options,
    headers,
  });
};
