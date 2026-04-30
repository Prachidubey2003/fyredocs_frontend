type ApiRequestOptions = RequestInit & {
  skipRefresh?: boolean;
};

const getBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
  return envUrl.trim().length > 0 ? envUrl : '';
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
    // Handle API error format: { error: { code: string, details: string }, message: string }
    if (data?.error?.details) {
      message = data.error.details;
    } else if (data?.error?.message) {
      message = data.error.message;
    } else if (data?.error && typeof data.error === 'string') {
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

const buildHeaders = (headers?: HeadersInit): Headers => {
  return new Headers(headers);
};

// Shared refresh lock — prevents multiple concurrent refresh calls
let refreshPromise: Promise<boolean> | null = null;

const attemptRefresh = async (): Promise<boolean> => {
  try {
    const res = await fetch(buildApiUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const apiRequest = async <T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const { skipRefresh, ...fetchOptions } = options;
  const headers = buildHeaders(fetchOptions.headers);

  const response = await fetch(buildApiUrl(path), {
    credentials: 'include', // Always include cookies
    ...fetchOptions,
    headers,
  });

  // On 401: try to refresh the access token, then retry the original request
  if (response.status === 401 && !skipRefresh) {
    if (!refreshPromise) {
      refreshPromise = attemptRefresh().finally(() => { refreshPromise = null; });
    }
    const refreshed = await refreshPromise;
    if (refreshed) {
      return apiRequest<T>(path, { ...options, skipRefresh: true });
    }
    window.dispatchEvent(new CustomEvent('fyredocs:unauthorized'));
    throw new Error(await parseErrorMessage(response));
  }

  // 403 = forbidden (not an expired token issue)
  if (response.status === 403 && !skipRefresh) {
    window.dispatchEvent(new CustomEvent('fyredocs:unauthorized'));
    throw new Error(await parseErrorMessage(response));
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
