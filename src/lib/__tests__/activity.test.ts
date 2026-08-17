import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  track,
  flush,
  __resetActivityForTests,
  __pendingForTests,
} from '@/lib/activity';
import { ACTIVITY_EVENTS } from '@/lib/activityEvents';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  __resetActivityForTests();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ status: 200 });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  __resetActivityForTests();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const lastRequestBody = () => {
  const [, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return JSON.parse(init.body as string) as {
    events: Array<Record<string, unknown>>;
  };
};

describe('track', () => {
  it('buffers events without sending immediately', () => {
    track({ eventType: ACTIVITY_EVENTS.jobStarted, status: 'started', toolId: 'merge' });
    expect(__pendingForTests()).toHaveLength(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('attaches clientEventId, session, platform, and timestamp automatically', async () => {
    track({ eventType: ACTIVITY_EVENTS.authLogin });
    await flush();
    const { events } = lastRequestBody();
    expect(events).toHaveLength(1);
    expect(events[0].clientEventId).toBeTruthy();
    expect(events[0].sessionId).toBeTruthy();
    expect(events[0].platform).toBe('web');
    expect(events[0].occurredAt).toBeTruthy();
    expect(events[0].status).toBe('success');
  });

  it('gives every event a distinct clientEventId', async () => {
    track({ eventType: ACTIVITY_EVENTS.authLogin });
    track({ eventType: ACTIVITY_EVENTS.authLogout });
    await flush();
    const { events } = lastRequestBody();
    expect(events[0].clientEventId).not.toBe(events[1].clientEventId);
  });

  it('keeps one sessionId across events in the same tab', async () => {
    track({ eventType: ACTIVITY_EVENTS.authLogin });
    track({ eventType: ACTIVITY_EVENTS.authLogout });
    await flush();
    const { events } = lastRequestBody();
    expect(events[0].sessionId).toBe(events[1].sessionId);
  });

  it('auto-flushes when the buffer reaches 20 events', () => {
    for (let i = 0; i < 20; i++) {
      track({ eventType: ACTIVITY_EVENTS.jobStarted, status: 'started' });
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('never throws even when the runtime is hostile', () => {
    vi.stubGlobal('fetch', () => {
      throw new Error('network gone');
    });
    expect(() => {
      track({ eventType: ACTIVITY_EVENTS.authLogin });
    }).not.toThrow();
  });
});

describe('flush', () => {
  it('does nothing with an empty buffer', async () => {
    await flush();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends with credentials and keepalive so cookies survive teardown', async () => {
    track({ eventType: ACTIVITY_EVENTS.authLogin });
    await flush();
    const [, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    expect(init.credentials).toBe('include');
    expect(init.keepalive).toBe(true);
  });

  it('re-buffers the batch on network failure for a later retry', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    track({ eventType: ACTIVITY_EVENTS.authLogin });
    await flush();
    expect(__pendingForTests()).toHaveLength(1);
  });

  it('re-buffers on 5xx but drops on 4xx (a rejected payload never succeeds)', async () => {
    fetchMock.mockResolvedValueOnce({ status: 503 });
    track({ eventType: ACTIVITY_EVENTS.authLogin });
    await flush();
    expect(__pendingForTests()).toHaveLength(1);

    fetchMock.mockResolvedValueOnce({ status: 400 });
    await flush();
    expect(__pendingForTests()).toHaveLength(0);
  });

  it('clears the buffer after a successful send', async () => {
    track({ eventType: ACTIVITY_EVENTS.authLogin });
    await flush();
    expect(__pendingForTests()).toHaveLength(0);
  });
});
