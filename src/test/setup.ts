import '@testing-library/jest-dom/vitest';

// jsdom in this project ships without a working localStorage/sessionStorage, so
// provide an in-memory implementation. Without it, code that persists state
// (e.g. cookie consent, active-org selection) silently no-ops in tests.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

if (typeof window.localStorage?.setItem !== 'function') {
  Object.defineProperty(window, 'localStorage', { writable: true, value: new MemoryStorage() });
}
if (typeof window.sessionStorage?.setItem !== 'function') {
  Object.defineProperty(window, 'sessionStorage', { writable: true, value: new MemoryStorage() });
}

// Mock window.matchMedia for next-themes and other responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
