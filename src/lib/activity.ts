/**
 * Client activity SDK: buffered, batched, fire-and-forget.
 *
 * Design constraints, in priority order:
 * 1. Never break the app — every entry point swallows its own errors, so a
 *    tracking outage costs events, never a tool run.
 * 2. Never lose the tail — a hidden/closing tab flushes via sendBeacon, the
 *    one transport the browser lets outlive the page.
 * 3. Never duplicate — every event carries a client-minted UUID; the server
 *    dedupes on it, so re-sending after an ambiguous failure is safe.
 *
 * Events are sent to POST /api/activity/events in batches, triggered by
 * whichever comes first: FLUSH_INTERVAL_MS, MAX_BUFFER events, or the tab
 * being hidden. Auth rides on cookies (same-origin), so anonymous visitors
 * are recorded as guests by the server — no identity is attached here.
 */

import { buildApiUrl } from '@/lib/apiClient';
import type { ActivityEventType, ActivityStatus } from '@/lib/activityEvents';

export interface TrackInput {
  eventType: ActivityEventType;
  status?: ActivityStatus;
  toolId?: string;
  featureId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  documentId?: string;
  failureReason?: string;
  errorCode?: string;
  correlationId?: string;
  /** Whitelist-built by callers: sizes, counts, durations, ids. Never
   *  filenames, document contents, or anything user-typed. */
  metadata?: Record<string, string | number | boolean>;
  oldValue?: string | number | boolean;
  newValue?: string | number | boolean;
}

interface ActivityEventPayload extends TrackInput {
  clientEventId: string;
  sessionId: string;
  platform: 'web';
  appVersion?: string;
  occurredAt: string;
}

const FLUSH_INTERVAL_MS = 10_000;
const MAX_BUFFER = 20;
// Server-side batch limit; a bigger backlog is sent across multiple flushes.
const MAX_BATCH = 50;
// Cap on the retry backlog. Beyond this, oldest events are dropped: activity
// is a trail, not a ledger, and unbounded growth in a broken-network session
// is worse than a gap.
const MAX_BACKLOG = 200;

const SESSION_KEY = 'fyredocs.activity.sessionId';
const INGEST_PATH = '/api/activity/events';

let buffer: ActivityEventPayload[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let listenersInstalled = false;

const randomId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
};

/** Per-tab session id: sessionStorage scopes it to the tab and clears it when
 *  the tab closes, which is exactly the session granularity we want. */
const getSessionId = (): string => {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const fresh = randomId();
    sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    // Storage unavailable (private mode edge cases): session grouping is lost
    // for this tab, events still flow.
    return 'no-session';
  }
};

const appVersion = (): string | undefined => {
  try {
    return import.meta.env?.VITE_APP_VERSION as string | undefined;
  } catch {
    return undefined;
  }
};

const ensureRuntime = () => {
  if (flushTimer === null) {
    flushTimer = setInterval(() => {
      void flush();
    }, FLUSH_INTERVAL_MS);
  }
  if (!listenersInstalled && typeof document !== 'undefined') {
    listenersInstalled = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushWithBeacon();
      }
    });
  }
};

/**
 * Queue one event. Cheap and synchronous; safe to call from render-adjacent
 * code. Never throws.
 */
export const track = (input: TrackInput): void => {
  try {
    ensureRuntime();
    buffer.push({
      ...input,
      status: input.status ?? 'success',
      clientEventId: randomId(),
      sessionId: getSessionId(),
      platform: 'web',
      appVersion: appVersion(),
      occurredAt: new Date().toISOString(),
    });
    if (buffer.length >= MAX_BUFFER) {
      void flush();
    }
  } catch (err) {
    if (import.meta.env?.DEV) console.debug('[activity] track failed', err);
  }
};

/**
 * Send the buffered events with a keepalive fetch. On network failure the
 * batch is re-buffered (bounded by MAX_BACKLOG) — the per-event UUIDs make a
 * later re-send dedupe-safe server-side.
 */
export const flush = async (): Promise<void> => {
  if (buffer.length === 0) return;
  const batch = buffer.slice(0, MAX_BATCH);
  buffer = buffer.slice(MAX_BATCH);

  try {
    const res = await fetch(buildApiUrl(INGEST_PATH), {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
    });
    // 4xx means the payload itself is unacceptable; re-sending it would fail
    // identically, so only requeue on network errors and 5xx.
    if (res.status >= 500) {
      requeue(batch);
    }
  } catch (err) {
    requeue(batch);
    if (import.meta.env?.DEV) console.debug('[activity] flush failed', err);
  }
};

const requeue = (batch: ActivityEventPayload[]) => {
  buffer = [...batch, ...buffer].slice(-MAX_BACKLOG);
};

/**
 * Last-gasp flush for a hidden/closing tab. sendBeacon is fire-and-forget and
 * survives page teardown; cookies are attached automatically on same-origin
 * requests. Falls back to the async flush when beacon is unavailable.
 */
const flushWithBeacon = (): void => {
  if (buffer.length === 0) return;
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const batch = buffer.slice(0, MAX_BATCH);
      const blob = new Blob([JSON.stringify({ events: batch })], {
        type: 'application/json',
      });
      if (navigator.sendBeacon(buildApiUrl(INGEST_PATH), blob)) {
        buffer = buffer.slice(MAX_BATCH);
        return;
      }
    }
  } catch {
    // fall through to fetch
  }
  void flush();
};

/** Test-only: reset module state between cases. */
export const __resetActivityForTests = (): void => {
  buffer = [];
  if (flushTimer !== null) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
};

/** Test-only: inspect the pending buffer. */
export const __pendingForTests = (): ReadonlyArray<{ eventType: string }> => buffer;
