export type AuthState = {
  token?: string;
  userId?: string;
  guestToken?: string;
};

const STORAGE_KEY = 'esydocs.auth';

const normalize = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const readStorage = (): AuthState => {
  if (typeof window === 'undefined') {
    return {};
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    return {
      token: normalize(parsed.token),
      userId: normalize(parsed.userId),
      guestToken: normalize(parsed.guestToken),
    };
  } catch {
    return {};
  }
};

const writeStorage = (state: AuthState) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

let cachedState: AuthState = readStorage();
const listeners = new Set<(state: AuthState) => void>();

const notify = () => {
  const snapshot = getAuthState();
  listeners.forEach((listener) => listener(snapshot));
};

const applyUpdate = (state: AuthState, update: Partial<AuthState>): AuthState => {
  const next: AuthState = { ...state };

  if ('token' in update) {
    const token = normalize(update.token);
    if (token) {
      next.token = token;
    } else {
      delete next.token;
    }
  }

  if ('userId' in update) {
    const userId = normalize(update.userId);
    if (userId) {
      next.userId = userId;
    } else {
      delete next.userId;
    }
  }

  if ('guestToken' in update) {
    const guestToken = normalize(update.guestToken);
    if (guestToken) {
      next.guestToken = guestToken;
    } else {
      delete next.guestToken;
    }
  }

  return next;
};

const mergeAuth = (base: AuthState, override: AuthState): AuthState => {
  const merged: AuthState = { ...base };
  if (override.token) {
    merged.token = override.token;
  }
  if (override.userId) {
    merged.userId = override.userId;
  }
  if (override.guestToken) {
    merged.guestToken = override.guestToken;
  }
  return merged;
};

const getEnvAuth = (): AuthState => ({
  token: normalize(import.meta.env.VITE_API_AUTH_TOKEN as string | undefined),
  userId: normalize(import.meta.env.VITE_API_USER_ID as string | undefined),
  guestToken: normalize(import.meta.env.VITE_API_GUEST_TOKEN as string | undefined),
});

export const getAuthState = (): AuthState => mergeAuth(getEnvAuth(), cachedState);

export const setAuthState = (update: Partial<AuthState>) => {
  cachedState = applyUpdate(cachedState, update);
  writeStorage(cachedState);
  notify();
};

export const clearAuth = () => {
  cachedState = {};
  writeStorage(cachedState);
  notify();
};

export const setAuthToken = (token?: string) => setAuthState({ token });
export const setUserId = (userId?: string) => setAuthState({ userId });
export const setGuestToken = (guestToken?: string) => setAuthState({ guestToken });

export const getAuthHeaders = () => {
  const headers: Record<string, string> = {};
  const { token, userId, guestToken } = getAuthState();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (userId) {
    headers['X-User-ID'] = userId;
  }

  if (guestToken) {
    headers['X-Guest-Token'] = guestToken;
  }

  return headers;
};

export const subscribeAuth = (listener: (state: AuthState) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      cachedState = readStorage();
      notify();
    }
  });
}
