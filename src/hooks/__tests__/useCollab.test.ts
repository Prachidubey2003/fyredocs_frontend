import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { buildCollabUrl, useCollab } from '../useCollab';

// Stub WebSocket. JSDOM doesn't ship a real WS impl, so we install a
// constructable stub on `global.WebSocket` and surface the most recent
// instance to the test for direct manipulation.
//
// The stub matches the bits of the WebSocket interface we actually use:
// the four event handlers, `send`, `close`, `readyState`, and
// `binaryType`. It exposes `simulateOpen` / `simulateMessage` etc. so
// each test can drive the connection state without timing flakes.

class StubWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  url: string;
  binaryType: BinaryType = 'blob';
  readyState: number = StubWebSocket.CONNECTING;
  onopen: ((ev: Event) => unknown) | null = null;
  onmessage: ((ev: MessageEvent) => unknown) | null = null;
  onerror: ((ev: Event) => unknown) | null = null;
  onclose: ((ev: CloseEvent) => unknown) | null = null;
  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = StubWebSocket.CLOSED;
  });

  constructor(url: string) {
    this.url = url;
    wsInstances.push(this);
  }

  // Simulation helpers — tests drive the connection lifecycle via
  // these instead of fighting timing flakes from the real WS impl.
  simulateOpen() {
    this.readyState = StubWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }
  simulateMessage(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
  simulateError() {
    this.onerror?.(new Event('error'));
  }
  simulateClose() {
    this.readyState = StubWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }
}

const wsInstances: StubWebSocket[] = [];

const installWebSocketStub = () => {
  wsInstances.length = 0;
  (globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket =
    StubWebSocket as unknown as typeof WebSocket;
};

describe('buildCollabUrl', () => {
  it('converts http base to ws', () => {
    // jsdom's window.location is http://localhost/ — relative URLs
    // resolve against that.
    const url = buildCollabUrl('doc_123');
    expect(url).toMatch(/^ws:\/\/.*\/api\/collab\/v1\/docs\/doc_123\/connect$/);
  });

  it('appends access_token query parameter when provided', () => {
    const url = buildCollabUrl('doc_123', 'tok-abc');
    expect(url).toContain('access_token=tok-abc');
  });

  it('encodes special characters in docId', () => {
    const url = buildCollabUrl('doc with space', undefined);
    expect(url).toContain('/doc%20with%20space/');
  });
});

describe('useCollab', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    installWebSocketStub();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not connect when docId is null', () => {
    const { result } = renderHook(() => useCollab(null));
    expect(result.current.state).toBe('idle');
    expect(wsInstances).toHaveLength(0);
  });

  it('does not connect when enabled is false', () => {
    const { result } = renderHook(() =>
      useCollab('doc_1', { enabled: false })
    );
    expect(result.current.state).toBe('idle');
    expect(wsInstances).toHaveLength(0);
  });

  it('connects and transitions to open', () => {
    const { result } = renderHook(() => useCollab('doc_1'));
    expect(wsInstances).toHaveLength(1);
    expect(result.current.state).toBe('connecting');

    act(() => {
      wsInstances[0].simulateOpen();
    });
    expect(result.current.state).toBe('open');
  });

  it('delivers inbound binary frames as Uint8Array', () => {
    const onMessage = vi.fn();
    renderHook(() => useCollab('doc_1', { onMessage }));
    act(() => {
      wsInstances[0].simulateOpen();
      const payload = new Uint8Array([1, 2, 3]).buffer;
      wsInstances[0].simulateMessage(payload);
    });
    expect(onMessage).toHaveBeenCalledTimes(1);
    const arg = onMessage.mock.calls[0][0] as Uint8Array;
    expect(arg).toBeInstanceOf(Uint8Array);
    expect(Array.from(arg)).toEqual([1, 2, 3]);
  });

  it('send returns false before open, true after', () => {
    const { result } = renderHook(() => useCollab('doc_1'));
    expect(result.current.send(new Uint8Array([1]))).toBe(false);

    act(() => {
      wsInstances[0].simulateOpen();
    });
    expect(result.current.send(new Uint8Array([1, 2, 3]))).toBe(true);
    expect(wsInstances[0].send).toHaveBeenCalledTimes(1);
  });

  it('reconnects with exponential backoff after close', () => {
    const { result } = renderHook(() =>
      useCollab('doc_1', {
        initialReconnectDelayMs: 100,
        maxReconnectDelayMs: 1000,
      })
    );
    act(() => {
      wsInstances[0].simulateOpen();
      wsInstances[0].simulateClose();
    });
    expect(result.current.state).toBe('closed');
    expect(wsInstances).toHaveLength(1);

    // First retry after 100ms.
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(wsInstances).toHaveLength(2);
    expect(result.current.state).toBe('connecting');

    // Second close → next retry doubles to 200ms.
    act(() => {
      wsInstances[1].simulateClose();
      vi.advanceTimersByTime(100);
    });
    expect(wsInstances).toHaveLength(2); // not yet
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(wsInstances).toHaveLength(3);
  });

  it('stops reconnecting after maxReconnectAttempts', () => {
    renderHook(() =>
      useCollab('doc_1', {
        initialReconnectDelayMs: 10,
        maxReconnectDelayMs: 10,
        maxReconnectAttempts: 2,
      })
    );
    act(() => {
      wsInstances[0].simulateClose();
      vi.advanceTimersByTime(10);
    });
    act(() => {
      wsInstances[1].simulateClose();
      vi.advanceTimersByTime(10);
    });
    expect(wsInstances).toHaveLength(3);
    act(() => {
      wsInstances[2].simulateClose();
      vi.advanceTimersByTime(1000);
    });
    // Budget exhausted; no 4th attempt.
    expect(wsInstances).toHaveLength(3);
  });

  it('closes the socket and stops reconnecting on unmount', () => {
    const { unmount } = renderHook(() =>
      useCollab('doc_1', { initialReconnectDelayMs: 10 })
    );
    act(() => {
      wsInstances[0].simulateOpen();
    });
    unmount();
    expect(wsInstances[0].close).toHaveBeenCalled();
    // Any retry timer must be cancelled.
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(wsInstances).toHaveLength(1);
  });

  it('reconnect() resets backoff and dials immediately', () => {
    const { result } = renderHook(() =>
      useCollab('doc_1', { initialReconnectDelayMs: 5000 })
    );
    act(() => {
      wsInstances[0].simulateClose();
    });
    // Normally we'd have to wait 5000ms. Force-reconnect short-circuits.
    act(() => {
      result.current.reconnect();
    });
    expect(wsInstances).toHaveLength(2);
  });
});
