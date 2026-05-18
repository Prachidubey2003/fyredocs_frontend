import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import { render } from '@/test/test-utils';
import BillingSuccessPage from '../BillingSuccessPage';

// Backend Plan shape (mirrors fyredocs_backend/billing-service/internal/plans/plans.go).
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

const meFree = {
  plan: planFree,
  subscription: null,
  usage: null,
};

const meProConfirmed = {
  plan: planPro,
  subscription: {
    id: 'sub_1',
    userId: 'usr_1',
    planCode: 'pro',
    status: 'active' as const,
    seats: 1,
    stripeSubscriptionId: 'sub_stripe_xyz',
    currentPeriodStart: '2026-05-17T00:00:00Z',
    currentPeriodEnd: '2026-06-17T00:00:00Z',
    createdAt: '2026-05-17T00:00:00Z',
    updatedAt: '2026-05-17T00:00:00Z',
  },
  usage: null,
};

// Same plan code as initial (still "free"), but a Stripe row
// landed — covers the "user upgraded seats on the same plan"
// case where plan-code-change wouldn't fire confirmation but
// stripeSubscriptionId would.
const meFreeWithStripeSub = {
  plan: planFree,
  subscription: {
    id: 'sub_seats',
    userId: 'usr_1',
    planCode: 'free',
    status: 'active' as const,
    seats: 5,
    stripeSubscriptionId: 'sub_stripe_seats',
    currentPeriodStart: '2026-05-17T00:00:00Z',
    currentPeriodEnd: '2026-06-17T00:00:00Z',
    createdAt: '2026-05-17T00:00:00Z',
    updatedAt: '2026-05-17T00:00:00Z',
  },
  usage: null,
};

const okEnvelope = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

// queueFetchResponses mocks `fetch` to return the supplied
// responses in order — one per polling tick. Once exhausted,
// subsequent calls reuse the last response (matches the
// real "Stripe webhook still hasn't landed" path).
function queueFetchResponses(fetchSpy: ReturnType<typeof vi.spyOn>, responses: unknown[]) {
  let i = 0;
  fetchSpy.mockImplementation(async () => {
    const data = responses[Math.min(i, responses.length - 1)];
    i += 1;
    return okEnvelope(data);
  });
}

describe('BillingSuccessPage', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    // Clear any URL state from a previous test so each
    // assertion starts from a known location.
    window.history.replaceState({}, '', '/account/billing/success');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    vi.useRealTimers();
  });

  it('renders the pending state with a polling status indicator on first paint', async () => {
    queueFetchResponses(fetchSpy, [meFree]);
    render(<BillingSuccessPage />);

    // Heading + description reflect the pending state.
    expect(
      await screen.findByRole('heading', { name: /Confirming your subscription/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Checking with Stripe/i)).toBeInTheDocument();
    // The aria-live status region is the screen-reader hook
    // that announces the wait — confirm it landed with the
    // expected role.
    expect(screen.getByRole('status')).toHaveTextContent(/Waiting for Stripe webhook/);
  });

  it('passes the session_id from the URL through to the visible "Stripe session" line', async () => {
    window.history.replaceState({}, '', '/account/billing/success?session_id=cs_test_xyz');
    queueFetchResponses(fetchSpy, [meFree]);
    render(<BillingSuccessPage />);

    await waitFor(() => {
      expect(screen.getByText(/Stripe session:/i)).toBeInTheDocument();
    });
    expect(screen.getByText('cs_test_xyz')).toBeInTheDocument();
  });

  it('confirms the subscription when the plan code changes mid-poll (free → pro)', async () => {
    // First poll → still free. Second poll → pro. The
    // page should flip to "confirmed" + display the new
    // plan name.
    queueFetchResponses(fetchSpy, [meFree, meProConfirmed]);
    render(<BillingSuccessPage />);

    // Drive the polling interval forward by 1500ms (one
    // tick). vi.advanceTimersByTimeAsync flushes microtasks
    // between ticks so the awaited getMe resolves.
    await vi.advanceTimersByTimeAsync(1500);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /You.re subscribed/i }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/You're now on the Pro plan/i)).toBeInTheDocument();
  });

  it('confirms the subscription when stripeSubscriptionId appears even if plan code is unchanged', async () => {
    // Seat-upgrade case: plan code stays "free" but the
    // subscription row now carries a Stripe id. The page
    // confirms on that signal alone.
    queueFetchResponses(fetchSpy, [meFree, meFreeWithStripeSub]);
    render(<BillingSuccessPage />);

    await vi.advanceTimersByTimeAsync(1500);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /You.re subscribed/i }),
      ).toBeInTheDocument();
    });
  });

  it('falls through to the timeout warning after 20 polling attempts (30s) with no confirmation', async () => {
    // Stripe webhook is stuck. Every getMe returns the
    // unchanged free plan. After 20 × 1500ms = 30s, the page
    // surfaces the timeout banner.
    queueFetchResponses(fetchSpy, [meFree]);
    render(<BillingSuccessPage />);

    // Advance well past 20 ticks — 35s of polling time.
    await vi.advanceTimersByTimeAsync(35_000);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/webhook hasn't arrived/i);
    });
    // The polling status indicator disappears once we hit
    // timeout — the alert replaces it.
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('keeps polling through transient fetch errors without flipping to timeout early', async () => {
    // Inject one error response in the middle of the poll
    // sequence — the page MUST keep polling. Pre-error and
    // post-error responses both return the unchanged free
    // plan so the test isolates the error-recovery behaviour
    // from the confirmation path.
    let i = 0;
    fetchSpy.mockImplementation(async () => {
      i += 1;
      if (i === 3) {
        return new Response('boom', { status: 503 });
      }
      return okEnvelope(meFree);
    });

    render(<BillingSuccessPage />);
    // Drive 5 ticks. None should confirm; the page should
    // stay in pending throughout (we haven't crossed the
    // 30s timeout yet).
    await vi.advanceTimersByTimeAsync(7_500);

    // Still pending.
    expect(
      screen.getByRole('heading', { name: /Confirming your subscription/i }),
    ).toBeInTheDocument();
    // The transient error did not surface as a timeout
    // alert — the timeout band is reserved for the
    // attempt-budget exhaustion path.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders Back-to-billing and dashboard links so the user can navigate away mid-poll', async () => {
    queueFetchResponses(fetchSpy, [meFree]);
    render(<BillingSuccessPage />);

    const backLink = await screen.findByRole('link', { name: /Back to billing/i });
    expect(backLink).toHaveAttribute('href', '/account/billing');
    const dashLink = screen.getByRole('link', { name: /Go to dashboard/i });
    expect(dashLink).toHaveAttribute('href', '/');
  });

  it('stops polling on unmount so a navigation-away doesn’t leak fetches', async () => {
    queueFetchResponses(fetchSpy, [meFree]);
    const { unmount } = render(<BillingSuccessPage />);

    // One tick — confirm at least one fetch fired so the
    // unmount-vs-no-fetch assertion below is meaningful.
    await vi.advanceTimersByTimeAsync(1500);
    const callsBefore = fetchSpy.mock.calls.length;
    expect(callsBefore).toBeGreaterThan(0);

    unmount();

    // Advance well past several would-be ticks. The cleanup
    // function clears the interval; no further fetches.
    await vi.advanceTimersByTimeAsync(5_000);
    expect(fetchSpy.mock.calls.length).toBe(callsBefore);
  });
});
