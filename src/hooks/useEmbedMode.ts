import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Returns `true` when the current URL carries `?embed=1`. This
 * is the wire-format flag `@fyredocs/embed` passes via its
 * iframe URL; when true, the app shell hides global chrome
 * (Header / Footer / skip-link) and the EditorPage broadcasts
 * its lifecycle events via `window.parent.postMessage`.
 *
 * Pulled into its own hook so the embed-vs-standalone branch is
 * one cheap useMemo away from every component that needs it,
 * and tests can spy on the URL via MemoryRouter without
 * mocking globals.
 */
export function useEmbedMode(): boolean {
  const [params] = useSearchParams();
  return useMemo(() => params.get('embed') === '1', [params]);
}

/**
 * postEmbedMessage is the typed sender that the EditorPage uses
 * to broadcast its lifecycle to the parent frame.
 *
 * The wire shape `{type, payload}` is what `@fyredocs/embed`
 * validates on the receive side — keep these aligned. Renaming
 * any `type` string is a major-version break for the embed SDK.
 *
 * `targetOrigin` is computed from `document.referrer` so each
 * message is addressed to the partner page that actually loaded
 * the iframe, NOT broadcast to every origin that happens to share
 * the browser. Two-layer security:
 *
 *   1. Receive-side filter (`event.source === iframe.contentWindow`)
 *      already prevents cross-talk between multiple
 *      `<fyredocs-editor>` instances on the same page.
 *   2. Sender-side `targetOrigin` (this function) prevents a
 *      malicious sibling-frame from sniffing messages even when
 *      the iframe runs in a permissive sandbox.
 *
 * Fallback to `'*'` only when the parent's origin is unknowable
 * — typically a partner that ships `Referrer-Policy: no-referrer`.
 * Document this as a degraded mode in the embed README; partners
 * who care about defence-in-depth ship a referrer policy that at
 * least leaks `origin`.
 */
export type EmbedEventType = 'ready' | 'edit' | 'save' | 'error';

export interface EmbedMessage {
  type: EmbedEventType;
  payload?: unknown;
}

/**
 * resolveParentOrigin returns the origin we'll address with
 * `postMessage`'s `targetOrigin` argument. Exported for tests;
 * callers should use `postEmbedMessage`.
 *
 *   - If `document.referrer` is a parseable URL → its `origin`.
 *   - Otherwise (cross-origin policy strips referrer, SSR
 *     environment without `document`, etc.) → `'*'` so messages
 *     still reach the parent. The receive-side filter remains
 *     the trust boundary in that case.
 */
export function resolveParentOrigin(): string {
  if (typeof document === 'undefined') return '*';
  const ref = document.referrer;
  if (!ref) return '*';
  try {
    return new URL(ref).origin;
  } catch {
    return '*';
  }
}

export function postEmbedMessage(msg: EmbedMessage): void {
  // Guard against:
  //   - Test environments where window.parent doesn't exist.
  //   - Non-embed mode where window.parent === window (no-op
  //     would still be safe but skipping is cleaner).
  if (typeof window === 'undefined') return;
  if (window.parent === window) return;
  window.parent.postMessage(msg, resolveParentOrigin());
}

/** Debounce window for `fyredocs:save`. 1.5s of no further
 *  edits — long enough that rapid toolbar clicks coalesce into
 *  one save, short enough that an idle user gets the signal
 *  within their next breath. */
export const SAVE_DEBOUNCE_MS = 1500;

/**
 * useDebouncedEmbedSave fires `fyredocs:save` to the host page
 * after a quiet period of no further edits. Distinct from
 * `fyredocs:edit` (which fires per revision, chatty by design):
 * `save` is a coarser "burst settled, document is in a clean
 * state" signal that hosts can use to show "Saved" UI or
 * refresh their own caches without thrash.
 *
 * Each new `revId` resets the debounce; the timer fires once
 * the latest value has been stable for `debounceMs`. We dedupe
 * by the last-dispatched revId so React StrictMode's effect
 * double-invoke doesn't double-fire the event.
 *
 * No-op when `enabled` is false (non-embed mode) or `ready` is
 * false (the initial load shouldn't produce a save — that's
 * `ready`'s domain). The unmount cleanup cancels any pending
 * timer so navigating away mid-debounce doesn't leak.
 */
export function useDebouncedEmbedSave(opts: {
  enabled: boolean;
  ready: boolean;
  revId: string | null;
  debounceMs?: number;
}): void {
  const { enabled, ready, revId, debounceMs = SAVE_DEBOUNCE_MS } = opts;
  const timerRef = useRef<number | null>(null);
  const lastDispatchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !ready || !revId) return;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    const targetRev = revId;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      if (lastDispatchedRef.current === targetRev) return;
      lastDispatchedRef.current = targetRev;
      postEmbedMessage({ type: 'save', payload: { revId: targetRev } });
    }, debounceMs);
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, ready, revId, debounceMs]);
}
