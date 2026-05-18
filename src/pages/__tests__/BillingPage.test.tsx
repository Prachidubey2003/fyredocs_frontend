import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { render } from '@/test/test-utils';
import BillingPage from '../BillingPage';

// Minimal plan registry the page receives from
// `/v1/billing/plans`. Two plans so each test has exactly
// one "Switch" button — keeps queries unambiguous.
const planFree = {
  code: 'free',
  name: 'Free',
  description: 'Casual',
  monthlyPriceCents: 0,
  perSeat: false,
  selfServe: true,
  limits: {},
};
const planPro = {
  code: 'pro',
  name: 'Pro',
  description: 'Power users',
  monthlyPriceCents: 1500,
  perSeat: false,
  selfServe: true,
  limits: {},
};

const meOnPro = {
  plan: planPro,
  subscription: {
    id: 'sub_1',
    userId: 'usr_1',
    planCode: 'pro',
    status: 'active' as const,
    seats: 1,
    currentPeriodStart: '2026-05-01T00:00:00Z',
    currentPeriodEnd: '2026-06-01T00:00:00Z',
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
  },
  usage: null,
};

const meOnFree = {
  plan: planFree,
  subscription: null,
  usage: null,
};

const earning = {
  id: 'e1',
  transactionId: 'ch_test',
  pluginId: 'plug_super',
  grossCents: 5000,
  developerShareCents: 3500,
  currency: 'USD',
  status: 'paid' as const,
  recordedAt: '2026-05-17T00:00:00Z',
};

// envelope is the standard `success: true, data: ...` shape
// the backend ships across every endpoint.
const okEnvelope = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

// Helper to mock the three parallel fetches BillingPage fires
// on mount via Promise.allSettled: getMe + listPlans +
// listMarketplaceEarnings.
function mockBillingFetches(
  fetchSpy: ReturnType<typeof vi.spyOn>,
  opts: {
    me?: unknown;
    plans?: unknown[];
    earningsItems?: unknown[];
    earningsTotal?: number;
    failEarnings?: boolean;
    failMe?: boolean;
  },
) {
  // The page fires getMe + listPlans + listMarketplaceEarnings
  // in a single Promise.allSettled — order doesn't strictly
  // match the array order because fetch is async, but vi's
  // mock-by-url is the robust solution rather than order
  // assumptions.
  fetchSpy.mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes('/me/marketplace-earnings')) {
      if (opts.failEarnings) {
        return new Response('boom', { status: 503 });
      }
      return okEnvelope({
        items: opts.earningsItems ?? [],
        totalEarnedCents: opts.earningsTotal ?? 0,
      });
    }
    if (url.endsWith('/billing/me')) {
      if (opts.failMe) {
        return new Response(
          JSON.stringify({ success: false, error: { details: 'me-service down' } }),
          { status: 503, headers: { 'content-type': 'application/json' } },
        );
      }
      return okEnvelope(opts.me ?? meOnPro);
    }
    if (url.endsWith('/billing/plans')) {
      return okEnvelope({ plans: opts.plans ?? [planFree, planPro] });
    }
    // Catch-all so a stray call surfaces in the test rather
    // than silently returning undefined.
    throw new Error(`unmocked fetch: ${url}`);
  });
}

describe('BillingPage', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    fetchSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('renders the current plan, usage section, and plan picker on happy path', async () => {
    mockBillingFetches(fetchSpy, {});
    render(<BillingPage />);

    // The user is on Pro → "Pro" appears twice (once in
    // CurrentPlanCard at the top, once in the PlanPicker
    // grid). Finding both pins both sections rendered.
    await waitFor(() => {
      expect(screen.getAllByRole('heading', { name: /^Pro$/ })).toHaveLength(2);
    });
    // Plan picker also renders Free as the other tile.
    expect(screen.getByRole('heading', { name: /^Free$/ })).toBeInTheDocument();
    // Usage section heading is always present (UsageTable
    // shows its own empty/unavailable state inside).
    expect(screen.getByRole('heading', { name: /Current period usage/i })).toBeInTheDocument();
  });

  it('does NOT render the marketplace earnings card when items are empty', async () => {
    // Default mock: earnings returns { items: [] }. This is
    // the common case (the vast majority of users are not
    // marketplace developers); the card must stay hidden.
    mockBillingFetches(fetchSpy, {});
    render(<BillingPage />);
    await waitFor(() => {
      // Page rendered when both Pro headings (CurrentPlanCard
      // + PlanPicker tile) are mounted.
      expect(screen.getAllByRole('heading', { name: /^Pro$/ })).toHaveLength(2);
    });
    expect(screen.queryByText(/Marketplace earnings/i)).not.toBeInTheDocument();
  });

  it('renders the marketplace earnings card only when there is at least one entry', async () => {
    mockBillingFetches(fetchSpy, {
      earningsItems: [earning],
      earningsTotal: 3500,
    });
    render(<BillingPage />);
    await waitFor(() => {
      expect(screen.getByText(/Marketplace earnings/i)).toBeInTheDocument();
    });
    expect(screen.getByText('plug_super')).toBeInTheDocument();
  });

  it('falls open when the marketplace-earnings fetch fails — page still renders without the card', async () => {
    // Promise.allSettled means an earnings failure does NOT
    // block the page. Pin this: a 503 on /marketplace-earnings
    // must still show CurrentPlanCard + PlanPicker, with NO
    // marketplace card and NO load-error banner (the
    // load-error banner is reserved for getMe failures —
    // earnings is a bonus tile).
    mockBillingFetches(fetchSpy, { failEarnings: true });
    render(<BillingPage />);
    await waitFor(() => {
      expect(screen.getAllByRole('heading', { name: /^Pro$/ })).toHaveLength(2);
    });
    expect(screen.queryByText(/Marketplace earnings/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('surfaces the load-error banner with a Retry button when getMe fails', async () => {
    mockBillingFetches(fetchSpy, { failMe: true });
    render(<BillingPage />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    // CurrentPlanCard does NOT render when me is null —
    // neither the CurrentPlanCard's Pro heading nor the
    // PlanPicker's Pro tile is present (PlanPicker also
    // requires me to render).
    expect(screen.queryAllByRole('heading', { name: /^Pro$/ })).toHaveLength(0);
  });

  it('Retry re-fetches and recovers the page after a transient getMe failure', async () => {
    // First load fails; user clicks Retry; second load
    // succeeds and the page renders normally.
    let attempts = 0;
    fetchSpy.mockImplementation(async (input: RequestInfo | URL) => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.endsWith('/billing/me')) {
        attempts += 1;
        if (attempts === 1) {
          return new Response('boom', { status: 503 });
        }
        return okEnvelope(meOnPro);
      }
      if (url.endsWith('/billing/plans')) {
        return okEnvelope({ plans: [planFree, planPro] });
      }
      if (url.includes('/me/marketplace-earnings')) {
        return okEnvelope({ items: [], totalEarnedCents: 0 });
      }
      throw new Error(`unmocked fetch: ${url}`);
    });

    render(<BillingPage />);

    const retry = await screen.findByRole('button', { name: /Retry/i });
    await userEvent.click(retry);

    await waitFor(() => {
      expect(screen.getAllByRole('heading', { name: /^Pro$/ })).toHaveLength(2);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('switching to the free plan POSTs /subscribe (no Stripe checkout) and updates the page in place', async () => {
    // Setup: user is on Pro. The free plan offers a "Switch"
    // button that hits /me/subscribe directly (no Stripe).
    const subscribeCalls: Array<{ url: string; body: unknown }> = [];
    fetchSpy.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.endsWith('/billing/me') && (!init || init.method === undefined || init.method === 'GET')) {
        return okEnvelope(meOnPro);
      }
      if (url.endsWith('/billing/plans')) {
        return okEnvelope({ plans: [planFree, planPro] });
      }
      if (url.includes('/me/marketplace-earnings')) {
        return okEnvelope({ items: [], totalEarnedCents: 0 });
      }
      if (url.endsWith('/me/subscribe') && init?.method === 'POST') {
        subscribeCalls.push({ url, body: init?.body ? JSON.parse(init.body as string) : null });
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              id: 'sub_free',
              userId: 'usr_1',
              planCode: 'free',
              status: 'active',
              seats: 1,
              currentPeriodStart: '2026-05-17T00:00:00Z',
              currentPeriodEnd: '2026-06-17T00:00:00Z',
              createdAt: '2026-05-17T00:00:00Z',
              updatedAt: '2026-05-17T00:00:00Z',
            },
          }),
          { status: 201, headers: { 'content-type': 'application/json' } },
        );
      }
      throw new Error(`unmocked fetch: ${url} ${init?.method ?? ''}`);
    });

    render(<BillingPage />);

    // Wait for the picker to render, then locate the Switch
    // button inside the "Free" plan card.
    const freeHeading = await screen.findByRole('heading', { name: /^Free$/ });
    const freeCard = freeHeading.closest('div[class*="rounded"]') as HTMLElement;
    expect(freeCard).toBeTruthy();
    const switchBtn = within(freeCard).getByRole('button', { name: /^Switch$/ });
    await userEvent.click(switchBtn);

    await waitFor(() => {
      expect(subscribeCalls).toHaveLength(1);
    });
    expect(subscribeCalls[0].body).toEqual({ planCode: 'free' });

    // In-place state update: the CurrentPlanCard heading
    // flips to "Free" without a refetch.
    await waitFor(() => {
      expect(screen.getAllByRole('heading', { name: /^Free$/ }).length).toBeGreaterThanOrEqual(2);
    });
  });

  it('switching to a paid plan opens Stripe checkout via window.location.assign', async () => {
    // Setup: user is on Free, clicks "Switch" inside the Pro
    // card. BillingPage calls POST /checkout/session and
    // navigates to session.url via window.location.assign.
    const assignSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, assign: assignSpy },
    });

    const checkoutCalls: Array<unknown> = [];
    fetchSpy.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.endsWith('/billing/me')) {
        return okEnvelope(meOnFree);
      }
      if (url.endsWith('/billing/plans')) {
        return okEnvelope({ plans: [planFree, planPro] });
      }
      if (url.includes('/me/marketplace-earnings')) {
        return okEnvelope({ items: [], totalEarnedCents: 0 });
      }
      if (url.endsWith('/checkout/session') && init?.method === 'POST') {
        checkoutCalls.push(init?.body ? JSON.parse(init.body as string) : null);
        return new Response(
          JSON.stringify({
            success: true,
            message: 'checkout session created',
            sessionId: 'cs_test_xyz',
            url: 'https://checkout.stripe.com/c/pay/cs_test_xyz',
          }),
          { status: 201, headers: { 'content-type': 'application/json' } },
        );
      }
      throw new Error(`unmocked fetch: ${url}`);
    });

    render(<BillingPage />);

    // The user is on Free → "Switch" appears next to Pro.
    const proHeading = await screen.findByRole('heading', { name: /^Pro$/ });
    const proCard = proHeading.closest('div[class*="rounded"]') as HTMLElement;
    expect(proCard).toBeTruthy();
    const switchBtn = within(proCard).getByRole('button', { name: /^Switch$/ });
    await userEvent.click(switchBtn);

    await waitFor(() => {
      expect(checkoutCalls).toHaveLength(1);
    });
    expect(checkoutCalls[0]).toEqual({ planCode: 'pro' });

    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_test_xyz');
    });
  });

  it('surfaces a plan-switch error inline without unmounting the rest of the page', async () => {
    fetchSpy.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.endsWith('/billing/me')) {
        return okEnvelope(meOnPro);
      }
      if (url.endsWith('/billing/plans')) {
        return okEnvelope({ plans: [planFree, planPro] });
      }
      if (url.includes('/me/marketplace-earnings')) {
        return okEnvelope({ items: [], totalEarnedCents: 0 });
      }
      if (url.endsWith('/me/subscribe') && init?.method === 'POST') {
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'INVALID_PLAN', details: 'Unknown plan code' },
          }),
          { status: 400, headers: { 'content-type': 'application/json' } },
        );
      }
      throw new Error(`unmocked fetch: ${url}`);
    });

    render(<BillingPage />);

    const freeHeading = await screen.findByRole('heading', { name: /^Free$/ });
    const freeCard = freeHeading.closest('div[class*="rounded"]') as HTMLElement;
    const switchBtn = within(freeCard).getByRole('button', { name: /^Switch$/ });
    await userEvent.click(switchBtn);

    // Error message appears in the actionError region —
    // BillingPage renders it as a destructive-styled
    // <p role="alert"> inside the "Switch plan" section.
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((el) => /Unknown plan code/.test(el.textContent ?? ''))).toBe(true);
    });

    // CurrentPlanCard heading is still "Pro" (unchanged):
    // the failed switch must not corrupt state. Both Pro
    // headings (CurrentPlanCard + PlanPicker tile) survive.
    expect(screen.getAllByRole('heading', { name: /^Pro$/ })).toHaveLength(2);
  });
});
