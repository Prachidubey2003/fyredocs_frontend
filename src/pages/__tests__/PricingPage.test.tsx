import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import { render } from '@/test/test-utils';
import PricingPage from '../PricingPage';

// Backend `Plan` shape (mirrors fyredocs_backend/billing-service/internal/plans/plans.go).
const backendPlans = [
  {
    code: 'free',
    name: 'Free',
    description: '',
    monthlyPriceCents: 0,
    perSeat: false,
    selfServe: true,
    limits: {},
  },
  {
    code: 'pro',
    name: 'Pro',
    description: '',
    monthlyPriceCents: 1500,
    yearlyPriceCents: 1200,
    perSeat: false,
    selfServe: true,
    limits: {},
  },
  {
    code: 'teams',
    name: 'Teams',
    description: '',
    monthlyPriceCents: 2000,
    perSeat: true,
    selfServe: true,
    limits: {},
  },
  {
    code: 'business',
    name: 'Business',
    description: '',
    monthlyPriceCents: 3500,
    perSeat: true,
    selfServe: true,
    limits: {},
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    description: '',
    monthlyPriceCents: -1,
    perSeat: true,
    selfServe: false,
    limits: {},
  },
];

describe('PricingPage', () => {
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

  it('renders all five plans from the live registry', async () => {
    fetchSpy.mockResolvedValueOnce(okJson({ success: true, data: { plans: backendPlans } }));
    render(<PricingPage />);

    // Wait for fetch to resolve + cards to render.
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Pro$/i })).toBeInTheDocument();
    });
    for (const name of ['Free', 'Pro', 'Teams', 'Business', 'Enterprise']) {
      expect(screen.getByRole('heading', { name: new RegExp(`^${name}$`, 'i') })).toBeInTheDocument();
    }
  });

  it('renders the live monthly price for paid plans', async () => {
    // Backend monthlyPriceCents=1500 → "$15" in the UI. Pin
    // this so a backend price change automatically flows
    // through; a hard-coded marketing-only value here would
    // be the entire bug we're preventing.
    fetchSpy.mockResolvedValueOnce(okJson({ success: true, data: { plans: backendPlans } }));
    render(<PricingPage />);

    await waitFor(() => {
      expect(screen.getByText('$15')).toBeInTheDocument();
    });
    expect(screen.getByText('$20')).toBeInTheDocument(); // Teams 2000c
    expect(screen.getByText('$35')).toBeInTheDocument(); // Business 3500c
  });

  it('marks the paid plans with per-user/month or per-month suffix', async () => {
    fetchSpy.mockResolvedValueOnce(okJson({ success: true, data: { plans: backendPlans } }));
    render(<PricingPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/per user \/ month/i).length).toBeGreaterThan(0);
    });
    // Pro is not per-seat → plain "per month".
    expect(screen.getAllByText(/per month/i).length).toBeGreaterThan(0);
  });

  it('renders "Free" / "forever" for the free plan and "Custom" / "contact us" for Enterprise', async () => {
    fetchSpy.mockResolvedValueOnce(okJson({ success: true, data: { plans: backendPlans } }));
    render(<PricingPage />);

    // "Free" appears twice — once as the card title (h3),
    // once as the price label. Both are expected, so just
    // confirm at least two matches landed.
    await waitFor(() => {
      expect(screen.getAllByText('Free').length).toBeGreaterThanOrEqual(2);
    });
    expect(screen.getByText('forever')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByText('contact us')).toBeInTheDocument();
  });

  it('surfaces a banner on fetch failure but keeps the page usable', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, error: { details: 'analytics-service down' } }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }),
    );
    render(<PricingPage />);

    // Banner shows the operator-friendly error message.
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    // The page heading is still there — outage doesn't kill
    // the route entirely.
    expect(screen.getByRole('heading', { name: /Simple, Transparent/i })).toBeInTheDocument();
  });

  it('filters out plans the backend ships without a frontend marketing variant', async () => {
    // The backend may launch experimental tiers that aren't
    // ready for the public pricing page. They should be
    // hidden, not rendered with placeholder copy.
    fetchSpy.mockResolvedValueOnce(
      okJson({
        success: true,
        data: {
          plans: [
            ...backendPlans,
            {
              code: 'experimental-tier-x',
              name: 'Experimental',
              description: '',
              monthlyPriceCents: 9999,
              perSeat: false,
              selfServe: false,
              limits: {},
            },
          ],
        },
      }),
    );
    render(<PricingPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Pro$/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: /Experimental/i })).not.toBeInTheDocument();
  });
});
