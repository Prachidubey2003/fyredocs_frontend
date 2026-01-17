export type TokenStorageType = 'memory' | 'localStorage';

const STORAGE_KEY = 'esydocs.accessToken';
// Access tokens are short-lived; prefer memory storage unless persistence is required.

const resolveStorageType = (): TokenStorageType => {
  const raw = (import.meta.env.VITE_ACCESS_TOKEN_STORAGE as string | undefined) ?? '';
  return raw.toLowerCase() === 'localstorage' ? 'localStorage' : 'memory';
};

const storageType = resolveStorageType();
let inMemoryToken: string | null = null;
const listeners = new Set<(token: string | null) => void>();

const isStorageAvailable = () => {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__token_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const canUseLocalStorage = storageType === 'localStorage' && isStorageAvailable();

const readLocalToken = () => {
  if (!canUseLocalStorage) return null;
  return window.localStorage.getItem(STORAGE_KEY);
};

const writeLocalToken = (token: string | null) => {
  if (!canUseLocalStorage) return;
  if (!token) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, token);
  }
};

const notify = (token: string | null) => {
  listeners.forEach((listener) => listener(token));
};

if (canUseLocalStorage) {
  inMemoryToken = readLocalToken();

  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      inMemoryToken = event.newValue;
      notify(inMemoryToken);
    }
  });
}

export const getAccessToken = () => {
  if (inMemoryToken) return inMemoryToken;
  if (canUseLocalStorage) {
    inMemoryToken = readLocalToken();
  }
  return inMemoryToken;
};

export const setAccessToken = (token: string) => {
  inMemoryToken = token;
  writeLocalToken(token);
  notify(token);
};

export const clearAccessToken = () => {
  inMemoryToken = null;
  writeLocalToken(null);
  notify(null);
};

export const subscribeAccessToken = (listener: (token: string | null) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
