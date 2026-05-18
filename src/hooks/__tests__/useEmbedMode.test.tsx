import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SAVE_DEBOUNCE_MS,
  postEmbedMessage,
  resolveParentOrigin,
  useDebouncedEmbedSave,
  useEmbedMode,
} from '../useEmbedMode';

// MemoryRouter lets us drive the URL via initialEntries without
// touching window.location — keeps tests deterministic + parallel-safe.
function wrapper(initialEntries: string[]) {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  );
}

describe('useEmbedMode', () => {
  it('returns false when ?embed is absent', () => {
    const { result } = renderHook(() => useEmbedMode(), {
      wrapper: wrapper(['/editor']),
    });
    expect(result.current).toBe(false);
  });

  it('returns true when ?embed=1', () => {
    const { result } = renderHook(() => useEmbedMode(), {
      wrapper: wrapper(['/editor?embed=1']),
    });
    expect(result.current).toBe(true);
  });

  it('returns false for ?embed= anything else', () => {
    // Defensive: only the literal "1" enables embed mode. A
    // partner who set `?embed=true` should not accidentally
    // strip the global chrome.
    for (const value of ['true', '0', 'yes', 'on', '']) {
      const { result } = renderHook(() => useEmbedMode(), {
        wrapper: wrapper([`/editor?embed=${value}`]),
      });
      expect(result.current, `embed=${value}`).toBe(false);
    }
  });

  it('coexists with other query params', () => {
    const { result } = renderHook(() => useEmbedMode(), {
      wrapper: wrapper(['/editor?doc=abc123&embed=1&theme=dark']),
    });
    expect(result.current).toBe(true);
  });
});

describe('postEmbedMessage', () => {
  // window.parent === window in the jsdom default. We swap a stub
  // parent in/out per test so `postMessage` can be observed without
  // breaking other tests that read window.parent.
  let originalParent: typeof window.parent;
  let parentStub: { postMessage: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    originalParent = window.parent;
    parentStub = { postMessage: vi.fn() };
    Object.defineProperty(window, 'parent', {
      configurable: true,
      get: () => parentStub,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'parent', {
      configurable: true,
      get: () => originalParent,
    });
  });

  it('posts {type, payload} to window.parent (default jsdom referrer is empty → targetOrigin=*)', () => {
    postEmbedMessage({ type: 'edit', payload: { revId: 'rev_abc' } });
    expect(parentStub.postMessage).toHaveBeenCalledTimes(1);
    expect(parentStub.postMessage).toHaveBeenCalledWith(
      { type: 'edit', payload: { revId: 'rev_abc' } },
      '*',
    );
  });

  it('posts an envelope without payload for events that have none', () => {
    postEmbedMessage({ type: 'ready' });
    expect(parentStub.postMessage).toHaveBeenCalledWith({ type: 'ready' }, '*');
  });

  it('addresses the parent origin from document.referrer when set', () => {
    // Simulate a partner page at https://partner.example.com
    // having opened the iframe — postMessage should be addressed
    // to that exact origin, not the wildcard.
    const originalReferrer = Object.getOwnPropertyDescriptor(Document.prototype, 'referrer');
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      get: () => 'https://partner.example.com/dashboard',
    });
    try {
      postEmbedMessage({ type: 'edit', payload: { revId: 'rev_42' } });
      expect(parentStub.postMessage).toHaveBeenCalledWith(
        { type: 'edit', payload: { revId: 'rev_42' } },
        'https://partner.example.com',
      );
    } finally {
      if (originalReferrer) {
        Object.defineProperty(Document.prototype, 'referrer', originalReferrer);
      }
    }
  });

  it('is a no-op when window.parent === window (non-embed mode)', () => {
    // Revert the stub so parent === window for THIS test.
    Object.defineProperty(window, 'parent', {
      configurable: true,
      get: () => window,
    });
    postEmbedMessage({ type: 'edit', payload: { revId: 'r' } });
    expect(parentStub.postMessage).not.toHaveBeenCalled();
  });
});

describe('resolveParentOrigin', () => {
  let originalReferrer: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalReferrer = Object.getOwnPropertyDescriptor(Document.prototype, 'referrer');
  });

  afterEach(() => {
    if (originalReferrer) {
      Object.defineProperty(Document.prototype, 'referrer', originalReferrer);
    }
  });

  function setReferrer(value: string): void {
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      get: () => value,
    });
  }

  it('returns the parent origin from a normal https referrer', () => {
    setReferrer('https://partner.example.com/path?q=1');
    expect(resolveParentOrigin()).toBe('https://partner.example.com');
  });

  it('preserves a non-default port', () => {
    setReferrer('http://localhost:5173/dashboard');
    expect(resolveParentOrigin()).toBe('http://localhost:5173');
  });

  it('falls back to `*` when the referrer is empty (strict referrer-policy)', () => {
    setReferrer('');
    expect(resolveParentOrigin()).toBe('*');
  });

  it('falls back to `*` for an unparseable referrer', () => {
    // Some browsers historically leaked weird referrer values
    // through bookmark-launches; the parser should fail closed.
    setReferrer('not a url');
    expect(resolveParentOrigin()).toBe('*');
  });
});

describe('useDebouncedEmbedSave', () => {
  let originalParent: typeof window.parent;
  let parentStub: { postMessage: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.useFakeTimers();
    originalParent = window.parent;
    parentStub = { postMessage: vi.fn() };
    Object.defineProperty(window, 'parent', {
      configurable: true,
      get: () => parentStub,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'parent', {
      configurable: true,
      get: () => originalParent,
    });
  });

  it('fires `save` after the debounce window elapses', () => {
    renderHook(() =>
      useDebouncedEmbedSave({ enabled: true, ready: true, revId: 'rev_1' }),
    );
    expect(parentStub.postMessage).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS);
    });
    expect(parentStub.postMessage).toHaveBeenCalledTimes(1);
    expect(parentStub.postMessage).toHaveBeenCalledWith(
      { type: 'save', payload: { revId: 'rev_1' } },
      '*',
    );
  });

  it('coalesces a burst of edits into one save with the latest revId', () => {
    const { rerender } = renderHook(
      ({ revId }: { revId: string }) =>
        useDebouncedEmbedSave({ enabled: true, ready: true, revId }),
      { initialProps: { revId: 'rev_1' } },
    );
    // Three rapid-fire edits before the debounce elapses.
    act(() => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS - 500);
    });
    rerender({ revId: 'rev_2' });
    act(() => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS - 200);
    });
    rerender({ revId: 'rev_3' });
    expect(parentStub.postMessage).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS);
    });
    expect(parentStub.postMessage).toHaveBeenCalledTimes(1);
    expect(parentStub.postMessage).toHaveBeenCalledWith(
      { type: 'save', payload: { revId: 'rev_3' } },
      '*',
    );
  });

  it('does NOT fire before `ready` is true', () => {
    const { rerender } = renderHook(
      ({ ready }: { ready: boolean }) =>
        useDebouncedEmbedSave({ enabled: true, ready, revId: 'rev_1' }),
      { initialProps: { ready: false } },
    );
    act(() => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS * 3);
    });
    expect(parentStub.postMessage).not.toHaveBeenCalled();
    // After `ready` flips on, the next debounce window settles.
    rerender({ ready: true });
    act(() => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS);
    });
    expect(parentStub.postMessage).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire in non-embed mode', () => {
    renderHook(() =>
      useDebouncedEmbedSave({ enabled: false, ready: true, revId: 'rev_1' }),
    );
    act(() => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS * 5);
    });
    expect(parentStub.postMessage).not.toHaveBeenCalled();
  });

  it('does NOT fire when revId is null', () => {
    renderHook(() =>
      useDebouncedEmbedSave({ enabled: true, ready: true, revId: null }),
    );
    act(() => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS * 2);
    });
    expect(parentStub.postMessage).not.toHaveBeenCalled();
  });

  it('cancels the pending timer on unmount', () => {
    const { unmount } = renderHook(() =>
      useDebouncedEmbedSave({ enabled: true, ready: true, revId: 'rev_1' }),
    );
    unmount();
    act(() => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS * 2);
    });
    expect(parentStub.postMessage).not.toHaveBeenCalled();
  });

  it('dedupes consecutive identical revIds (StrictMode replay)', () => {
    // Same revId rendered twice — should fire once.
    const { rerender } = renderHook(
      ({ revId }: { revId: string }) =>
        useDebouncedEmbedSave({ enabled: true, ready: true, revId }),
      { initialProps: { revId: 'rev_1' } },
    );
    act(() => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS);
    });
    expect(parentStub.postMessage).toHaveBeenCalledTimes(1);
    rerender({ revId: 'rev_1' });
    act(() => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS);
    });
    // Still one call total — the dedupe ref short-circuits the
    // second dispatch.
    expect(parentStub.postMessage).toHaveBeenCalledTimes(1);
  });

  it('respects a custom debounceMs', () => {
    renderHook(() =>
      useDebouncedEmbedSave({
        enabled: true,
        ready: true,
        revId: 'rev_1',
        debounceMs: 100,
      }),
    );
    act(() => {
      vi.advanceTimersByTime(99);
    });
    expect(parentStub.postMessage).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(parentStub.postMessage).toHaveBeenCalledTimes(1);
  });
});
