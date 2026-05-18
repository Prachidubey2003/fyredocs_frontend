import { useCallback, useEffect, useRef, useState } from 'react';
import { buildApiUrl } from '@/lib/apiClient';

/**
 * Connection state machine for {@link useCollab}.
 *
 * - `idle`         hook not yet mounted, or `enabled` is false.
 * - `connecting`   socket is being opened; reconnect attempts also pass through here.
 * - `open`         socket is open and `send()` is callable.
 * - `closed`       socket closed cleanly (peer or local); a reconnect is scheduled
 *                  unless we hit the max-retries budget.
 * - `error`        socket failed; same reconnect path as `closed`.
 */
export type CollabState =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'closed'
  | 'error';

export interface UseCollabOptions {
  /** Disable the hook without unmounting the component (default true). */
  enabled?: boolean;
  /** Inbound-frame handler. Called once per binary message from the server. */
  onMessage?: (payload: Uint8Array) => void;
  /**
   * Access token for the `?access_token=` query parameter. Optional — if
   * the user is signed in via httpOnly cookie the browser sends it on the
   * WS handshake automatically and this can be omitted. The query path
   * exists for flows where cookies aren't available (CORS-restricted
   * embeds, share-link previews) and matches the precedence documented
   * in `COLLAB_SERVICE.md` § Auth precedence.
   */
  accessToken?: string;
  /** Initial reconnect delay in ms (default 1000). */
  initialReconnectDelayMs?: number;
  /** Reconnect ceiling in ms (default 30_000). */
  maxReconnectDelayMs?: number;
  /** Stop reconnecting after this many failed attempts (default Infinity). */
  maxReconnectAttempts?: number;
}

export interface UseCollabReturn {
  state: CollabState;
  /**
   * Sends a binary frame to the collab-service. Returns true if the
   * payload was handed to the socket, false if the socket is not in
   * `open` state — in which case the caller is expected to re-emit on
   * the next `open` transition (Yjs's update protocol re-syncs full
   * state on reconnect, so dropping is correct).
   */
  send: (payload: Uint8Array | ArrayBuffer) => boolean;
  /** Force a fresh connect attempt now, resetting the backoff timer. */
  reconnect: () => void;
}

/**
 * Hook that owns one collab-service websocket per document. v0 is a
 * transport-only primitive: the hook moves opaque binary frames between
 * the editor tab and the room. When Yjs lands in a follow-up turn it
 * wraps `useCollab` and pipes `Y.applyUpdate` / `ydoc.on('update')`
 * through `onMessage` / `send`.
 *
 * Lifecycle:
 * - Mount with a docId → connect.
 * - Unmount → close socket, cancel any pending reconnect.
 * - `enabled=false` mid-session → close socket; flipping back to true
 *   re-connects.
 * - Network drop → `onclose` fires → exponential backoff reconnect.
 *
 * The hook is intentionally NOT memoising the `onMessage` callback —
 * passing a fresh lambda each render is fine because we read the latest
 * via a ref. This matches the pattern used by `useFileUpload`.
 */
export function useCollab(
  docId: string | null | undefined,
  options: UseCollabOptions = {}
): UseCollabReturn {
  const {
    enabled = true,
    onMessage,
    accessToken,
    initialReconnectDelayMs = 1000,
    maxReconnectDelayMs = 30_000,
    maxReconnectAttempts = Number.POSITIVE_INFINITY,
  } = options;

  const [state, setState] = useState<CollabState>('idle');
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef<typeof onMessage>(onMessage);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  // Increment to force the connect-effect to tear down + retry. Used by
  // the public `reconnect()` method.
  const [forceCycle, setForceCycle] = useState(0);

  // Keep the latest onMessage in a ref so callers don't have to memoise
  // it. The effect below reads `onMessageRef.current` inside the
  // websocket `onmessage` handler, so a re-render with a new callback
  // takes effect on the next inbound frame without recreating the WS.
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !docId) {
      setState('idle');
      return;
    }

    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      setState('connecting');

      const url = buildCollabUrl(docId, accessToken);
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch {
        // Bad URL or similar synchronous failure — schedule a retry.
        setState('error');
        scheduleReconnect();
        return;
      }
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        attemptRef.current = 0;
        setState('open');
      };

      ws.onmessage = (ev) => {
        const handler = onMessageRef.current;
        if (!handler) return;
        // The dumb-relay server always sends binary frames; coerce
        // defensively in case a future feature adds text frames.
        if (ev.data instanceof ArrayBuffer) {
          handler(new Uint8Array(ev.data));
          return;
        }
        if (ev.data instanceof Blob) {
          ev.data.arrayBuffer().then((buf) => handler(new Uint8Array(buf)));
          return;
        }
        // Text frame — pass through as UTF-8 bytes so the consumer's
        // contract (Uint8Array) holds regardless of frame type.
        if (typeof ev.data === 'string') {
          handler(new TextEncoder().encode(ev.data));
        }
      };

      ws.onerror = () => {
        if (cancelled) return;
        setState('error');
      };

      ws.onclose = () => {
        if (cancelled) return;
        wsRef.current = null;
        setState('closed');
        scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (cancelled) return;
      if (attemptRef.current >= maxReconnectAttempts) return;
      const delay = Math.min(
        initialReconnectDelayMs * 2 ** attemptRef.current,
        maxReconnectDelayMs
      );
      attemptRef.current += 1;
      clearReconnectTimer();
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, delay);
    };

    connect();

    return () => {
      cancelled = true;
      clearReconnectTimer();
      attemptRef.current = 0;
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) {
        // Detach handlers BEFORE close so the onclose retry path
        // doesn't fire during teardown.
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        try {
          ws.close();
        } catch {
          // ignore — already-closing socket, etc.
        }
      }
    };
  }, [
    docId,
    enabled,
    accessToken,
    forceCycle,
    initialReconnectDelayMs,
    maxReconnectDelayMs,
    maxReconnectAttempts,
    clearReconnectTimer,
  ]);

  const send = useCallback((payload: Uint8Array | ArrayBuffer) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    ws.send(payload);
    return true;
  }, []);

  const reconnect = useCallback(() => {
    attemptRef.current = 0;
    setForceCycle((n) => n + 1);
  }, []);

  return { state, send, reconnect };
}

/**
 * Builds the collab websocket URL from an API base path.
 *
 * The frontend's `VITE_API_BASE_URL` may be empty (same-origin), a
 * relative path, or an absolute http(s) URL. We accept all three and
 * normalise to ws(s).
 */
export function buildCollabUrl(docId: string, accessToken?: string): string {
  const base = buildApiUrl(`/api/collab/v1/docs/${encodeURIComponent(docId)}/connect`);
  let absolute: URL;
  if (base.startsWith('http://') || base.startsWith('https://')) {
    absolute = new URL(base);
  } else if (typeof window !== 'undefined') {
    absolute = new URL(base, window.location.origin);
  } else {
    // Server-rendered fallback — shouldn't happen for a WS client, but
    // keeps the function deterministic in tests with no `window`.
    absolute = new URL(base, 'http://localhost');
  }
  absolute.protocol = absolute.protocol === 'https:' ? 'wss:' : 'ws:';
  if (accessToken) {
    absolute.searchParams.set('access_token', accessToken);
  }
  return absolute.toString();
}
