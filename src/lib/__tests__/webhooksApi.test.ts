import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createWebhook,
  deleteWebhook,
  enableWebhook,
  listWebhookDeliveries,
  listWebhooks,
  rotateWebhookSecret,
  testWebhook,
} from '../webhooksApi';

describe('webhooksApi', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  const okJson = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });

  describe('listWebhooks', () => {
    it('GETs /api/notify/v1/notify/webhooks and unwraps `data.subscriptions`', async () => {
      fetchSpy.mockResolvedValueOnce(
        okJson({
          success: true,
          data: {
            subscriptions: [
              {
                id: 'w1',
                userId: 'u1',
                eventType: 'job.completed',
                targetUrl: 'https://hooks.example.com/x',
                secretPrefix: 'abcd1234',
                status: 'active',
                failureCount: 0,
                createdAt: '2026-05-17T00:00:00Z',
                updatedAt: '2026-05-17T00:00:00Z',
              },
            ],
          },
        }),
      );
      const got = await listWebhooks();
      expect(got).toHaveLength(1);
      expect(got[0].eventType).toBe('job.completed');

      const [url, init] = fetchSpy.mock.calls[0];
      expect(String(url)).toContain('/api/notify/v1/notify/webhooks');
      expect((init as RequestInit).method).toBe('GET');
      expect((init as RequestInit).credentials).toBe('include');
    });

    it('returns empty array when subscriptions is missing', async () => {
      fetchSpy.mockResolvedValueOnce(okJson({ success: true, data: null }));
      const got = await listWebhooks();
      expect(got).toEqual([]);
    });
  });

  describe('createWebhook', () => {
    it('POSTs the flat shape and returns the secret', async () => {
      fetchSpy.mockResolvedValueOnce(
        okJson(
          {
            id: 'w_test',
            userId: 'u_test',
            eventType: 'job.completed',
            targetUrl: 'https://hooks.zapier.com/abc',
            secretPrefix: 'zXyW1234',
            status: 'active',
            failureCount: 0,
            createdAt: '2026-05-17T00:00:00Z',
            updatedAt: '2026-05-17T00:00:00Z',
            secret: 'zXyW1234abcdefghIJKLMNOPqrstuvwxyz0123456',
          },
          201,
        ),
      );
      const got = await createWebhook({
        eventType: 'job.completed',
        targetUrl: 'https://hooks.zapier.com/abc',
      });
      expect(got.id).toBe('w_test');
      expect(got.secret).toMatch(/^zXyW1234/);
      expect(got.secretPrefix).toBe('zXyW1234');

      const [url, init] = fetchSpy.mock.calls[0];
      expect(String(url)).toContain('/api/notify/v1/notify/webhooks');
      const reqInit = init as RequestInit;
      expect(reqInit.method).toBe('POST');
      expect(JSON.parse(reqInit.body as string)).toEqual({
        eventType: 'job.completed',
        targetUrl: 'https://hooks.zapier.com/abc',
      });
    });

    it('surfaces server error message', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            error: { code: 'INVALID_TARGET_URL', details: 'targetUrl must use https:// for non-localhost hosts' },
          }),
          { status: 400, headers: { 'content-type': 'application/json' } },
        ),
      );
      await expect(
        createWebhook({ eventType: 'job.completed', targetUrl: 'http://evil.example' }),
      ).rejects.toThrow(/https:\/\//);
    });
  });

  describe('deleteWebhook', () => {
    it('DELETEs the path with URL-encoded id', async () => {
      fetchSpy.mockResolvedValueOnce(okJson({ success: true, data: { id: 'w1' } }));
      await deleteWebhook('w1');
      const [url, init] = fetchSpy.mock.calls[0];
      expect(String(url)).toContain('/api/notify/v1/notify/webhooks/w1');
      expect((init as RequestInit).method).toBe('DELETE');
    });
  });

  describe('listWebhookDeliveries', () => {
    it('GETs deliveries with default channel=webhook filter', async () => {
      fetchSpy.mockResolvedValueOnce(
        okJson({
          success: true,
          data: {
            items: [
              {
                id: 'd1',
                channel: 'webhook',
                target: 'https://hooks.example.com/x',
                status: 'delivered',
                attempts: 1,
                createdAt: '2026-05-17T00:00:00Z',
                updatedAt: '2026-05-17T00:00:01Z',
              },
            ],
          },
        }),
      );
      const got = await listWebhookDeliveries();
      expect(got).toHaveLength(1);
      expect(got[0].status).toBe('delivered');

      const [url] = fetchSpy.mock.calls[0];
      const urlString = String(url);
      expect(urlString).toContain('/api/notify/v1/notify/deliveries');
      expect(urlString).toContain('channel=webhook');
    });

    it('forwards explicit channel + limit', async () => {
      fetchSpy.mockResolvedValueOnce(okJson({ success: true, data: { items: [] } }));
      await listWebhookDeliveries({ channel: 'email', limit: 10 });
      const urlString = String(fetchSpy.mock.calls[0][0]);
      expect(urlString).toContain('channel=email');
      expect(urlString).toContain('limit=10');
    });

    it('omits channel filter when caller passes empty string', async () => {
      // `channel: ''` lets the caller opt out of the default
      // `webhook` filter to see deliveries across all channels.
      // This is what an admin/debug view would want.
      fetchSpy.mockResolvedValueOnce(okJson({ success: true, data: { items: [] } }));
      await listWebhookDeliveries({ channel: '' });
      const urlString = String(fetchSpy.mock.calls[0][0]);
      expect(urlString).not.toContain('channel=');
    });

    it('returns empty array when items is missing', async () => {
      fetchSpy.mockResolvedValueOnce(okJson({ success: true, data: { items: null } }));
      const got = await listWebhookDeliveries();
      expect(got).toEqual([]);
    });
  });

  describe('testWebhook', () => {
    it('POSTs to /test path and unwraps the delivery from `data.delivery`', async () => {
      fetchSpy.mockResolvedValueOnce(
        okJson({
          success: true,
          data: {
            delivery: {
              id: 'd-test-1',
              channel: 'webhook',
              target: 'https://hooks.example.com/x',
              status: 'delivered',
              attempts: 1,
              createdAt: '2026-05-17T00:00:00Z',
              updatedAt: '2026-05-17T00:00:01Z',
            },
          },
        }),
      );
      const got = await testWebhook('w1');
      expect(got.status).toBe('delivered');
      expect(got.id).toBe('d-test-1');

      const [url, init] = fetchSpy.mock.calls[0];
      expect(String(url)).toContain('/api/notify/v1/notify/webhooks/w1/test');
      expect((init as RequestInit).method).toBe('POST');
    });

    it('surfaces failed-delivery details via the returned row, not by throwing', async () => {
      // The endpoint returns 200 even when the receiver
      // responded non-2xx — the failure is data, not an
      // exception. UI uses the row's status + lastError to
      // render inline feedback.
      fetchSpy.mockResolvedValueOnce(
        okJson({
          success: true,
          data: {
            delivery: {
              id: 'd-test-2',
              channel: 'webhook',
              target: 'https://hooks.example.com/x',
              status: 'failed',
              attempts: 1,
              lastError: 'webhook: 500 Internal Server Error: explosion',
              createdAt: '2026-05-17T00:00:00Z',
              updatedAt: '2026-05-17T00:00:01Z',
            },
          },
        }),
      );
      const got = await testWebhook('w1');
      expect(got.status).toBe('failed');
      expect(got.lastError).toMatch(/500/);
    });
  });

  describe('rotateWebhookSecret', () => {
    it('POSTs to /rotate-secret and returns the flat shape with new plaintext', async () => {
      fetchSpy.mockResolvedValueOnce(
        okJson({
          id: 'w1',
          userId: 'u1',
          eventType: 'job.completed',
          targetUrl: 'https://hooks.example.com/x',
          secretPrefix: 'NEWp1234',
          status: 'active',
          failureCount: 0,
          createdAt: '2026-05-17T00:00:00Z',
          updatedAt: '2026-05-17T00:00:01Z',
          secret: 'NEWp1234abcdefghIJKLMNOPqrstuvwxyz0123456',
        }),
      );
      const got = await rotateWebhookSecret('w1');
      expect(got.secret).toMatch(/^NEWp1234/);
      expect(got.secretPrefix).toBe('NEWp1234');
      expect(got.id).toBe('w1');

      const [url, init] = fetchSpy.mock.calls[0];
      expect(String(url)).toContain('/api/notify/v1/notify/webhooks/w1/rotate-secret');
      expect((init as RequestInit).method).toBe('POST');
    });
  });

  describe('enableWebhook', () => {
    it('POSTs to the /enable path and unwraps `data`', async () => {
      fetchSpy.mockResolvedValueOnce(
        okJson({
          success: true,
          data: {
            id: 'w1',
            userId: 'u1',
            eventType: 'job.completed',
            targetUrl: 'https://hooks.example.com/x',
            secretPrefix: 'abcd1234',
            status: 'active',
            failureCount: 0,
            createdAt: '2026-05-17T00:00:00Z',
            updatedAt: '2026-05-17T00:00:00Z',
          },
        }),
      );
      const got = await enableWebhook('w1');
      expect(got.status).toBe('active');
      expect(got.failureCount).toBe(0);

      const [url, init] = fetchSpy.mock.calls[0];
      expect(String(url)).toContain('/api/notify/v1/notify/webhooks/w1/enable');
      expect((init as RequestInit).method).toBe('POST');
    });
  });
});
