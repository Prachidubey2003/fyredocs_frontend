import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createCheckoutSession,
  formatPrice,
  getMe,
  listMarketplaceEarnings,
  listPlans,
  subscribe,
} from '../billingApi';

describe('billingApi', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  const okJson = (body: unknown) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

  describe('listPlans', () => {
    it('unwraps `data.plans` into the public array', async () => {
      fetchSpy.mockResolvedValueOnce(
        okJson({
          success: true,
          data: {
            plans: [
              {
                code: 'free',
                name: 'Free',
                description: 'x',
                monthlyPriceCents: 0,
                perSeat: false,
                selfServe: true,
                limits: {},
              },
            ],
          },
        }),
      );
      const got = await listPlans();
      expect(got).toHaveLength(1);
      expect(got[0].code).toBe('free');
      expect(String(fetchSpy.mock.calls[0][0])).toContain('/api/billing/v1/billing/plans');
    });

    it('returns empty array when data is missing', async () => {
      fetchSpy.mockResolvedValueOnce(okJson({ success: true, data: { plans: null } }));
      const got = await listPlans();
      expect(got).toEqual([]);
    });
  });

  describe('getMe', () => {
    it('GETs /api/billing/v1/billing/me with credentials', async () => {
      const payload = {
        plan: {
          code: 'pro',
          name: 'Pro',
          description: 'x',
          monthlyPriceCents: 1500,
          perSeat: false,
          selfServe: true,
          limits: {},
        },
        subscription: null,
      };
      fetchSpy.mockResolvedValueOnce(okJson({ success: true, data: payload }));
      const got = await getMe();
      expect(got.plan.code).toBe('pro');

      const [url, init] = fetchSpy.mock.calls[0];
      expect(String(url)).toContain('/api/billing/v1/billing/me');
      expect((init as RequestInit).credentials).toBe('include');
    });
  });

  describe('subscribe', () => {
    it('POSTs JSON body to /api/billing/v1/billing/me/subscribe', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              id: 's1',
              userId: 'u1',
              planCode: 'pro',
              status: 'active',
              seats: 1,
              currentPeriodStart: '2026-05-01T00:00:00Z',
              currentPeriodEnd: '2026-06-01T00:00:00Z',
              createdAt: '2026-05-01T00:00:00Z',
              updatedAt: '2026-05-01T00:00:00Z',
            },
          }),
          { status: 201, headers: { 'content-type': 'application/json' } },
        ),
      );
      const got = await subscribe({ planCode: 'pro' });
      expect(got.planCode).toBe('pro');
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual({ planCode: 'pro' });
    });

    it('surfaces server error message', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            error: { code: 'INVALID_PLAN', details: 'Unknown plan code' },
          }),
          { status: 400, headers: { 'content-type': 'application/json' } },
        ),
      );
      await expect(subscribe({ planCode: 'fake' })).rejects.toThrow('Unknown plan code');
    });
  });

  describe('createCheckoutSession', () => {
    it('POSTs to /checkout/session and returns the flat {sessionId, url} shape', async () => {
      fetchSpy.mockResolvedValueOnce(
        okJson({
          success: true,
          message: 'checkout session created',
          sessionId: 'cs_test_xyz',
          url: 'https://checkout.stripe.com/c/pay/cs_test_xyz',
        }),
      );
      const got = await createCheckoutSession({ planCode: 'pro' });
      expect(got.sessionId).toBe('cs_test_xyz');
      expect(got.url).toMatch(/^https:\/\/checkout\.stripe\.com\//);

      const [url, init] = fetchSpy.mock.calls[0];
      expect(String(url)).toContain('/api/billing/v1/billing/checkout/session');
      const reqInit = init as RequestInit;
      expect(reqInit.method).toBe('POST');
      expect(JSON.parse(reqInit.body as string)).toEqual({ planCode: 'pro' });
    });

    it('forwards seat count when supplied', async () => {
      fetchSpy.mockResolvedValueOnce(
        okJson({ sessionId: 'cs_t', url: 'https://checkout.stripe.com/cs_t' }),
      );
      await createCheckoutSession({ planCode: 'teams', seats: 5 });
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(JSON.parse(init.body as string)).toEqual({ planCode: 'teams', seats: 5 });
    });

    it('surfaces backend STRIPE_ERROR message', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            error: { code: 'STRIPE_ERROR', details: 'Stripe rejected the request: No such price' },
          }),
          { status: 502, headers: { 'content-type': 'application/json' } },
        ),
      );
      await expect(createCheckoutSession({ planCode: 'pro' })).rejects.toThrow(/No such price/);
    });
  });

  describe('listMarketplaceEarnings', () => {
    it('GETs the earnings endpoint and unwraps the data envelope', async () => {
      fetchSpy.mockResolvedValueOnce(
        okJson({
          success: true,
          data: {
            items: [
              {
                id: 'e1',
                transactionId: 'ch_test',
                pluginId: 'plug_super',
                grossCents: 5000,
                developerShareCents: 3500,
                currency: 'USD',
                status: 'paid',
                recordedAt: '2026-05-17T00:00:00Z',
              },
            ],
            totalEarnedCents: 3500,
          },
        }),
      );
      const got = await listMarketplaceEarnings();
      expect(got.items).toHaveLength(1);
      expect(got.items[0].status).toBe('paid');
      expect(got.totalEarnedCents).toBe(3500);

      const [url, init] = fetchSpy.mock.calls[0];
      expect(String(url)).toContain('/api/billing/v1/billing/me/marketplace-earnings');
      expect((init as RequestInit).method).toBe('GET');
    });

    it('forwards status + limit query params', async () => {
      fetchSpy.mockResolvedValueOnce(
        okJson({ success: true, data: { items: [], totalEarnedCents: 0 } }),
      );
      await listMarketplaceEarnings({ status: 'paid', limit: 10 });
      const urlString = String(fetchSpy.mock.calls[0][0]);
      expect(urlString).toContain('status=paid');
      expect(urlString).toContain('limit=10');
    });

    it('returns an empty result when data is missing', async () => {
      fetchSpy.mockResolvedValueOnce(okJson({ success: true, data: null }));
      const got = await listMarketplaceEarnings();
      expect(got.items).toEqual([]);
      expect(got.totalEarnedCents).toBe(0);
    });
  });

  describe('formatPrice', () => {
    it('renders zero cents as "Free"', () => {
      expect(formatPrice(0)).toBe('Free');
    });
    it('renders sentinel -1 as "Custom"', () => {
      expect(formatPrice(-1)).toBe('Custom');
    });
    it('strips trailing zeros for whole-dollar prices', () => {
      expect(formatPrice(1500)).toBe('$15');
      expect(formatPrice(3500)).toBe('$35');
    });
    it('keeps decimals when the amount is not a whole dollar', () => {
      expect(formatPrice(1599)).toBe('$15.99');
    });
  });
});
