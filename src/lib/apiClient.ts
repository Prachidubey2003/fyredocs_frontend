const DEFAULT_API_BASE_URL = 'http://localhost:8080';

const getBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
  return envUrl.trim().length > 0 ? envUrl : DEFAULT_API_BASE_URL;
};

const normalizeBaseUrl = (baseUrl: string) =>
  baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

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

export const apiRequest = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(buildApiUrl(path), {
    credentials: options.credentials ?? 'include',
    ...options,
  });

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
  options: RequestInit = {}
): Promise<T> => {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return apiRequest<T>(path, {
    ...options,
    headers,
  });
};
