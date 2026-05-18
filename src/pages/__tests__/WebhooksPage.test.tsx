import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { render } from '@/test/test-utils';
import WebhooksPage from '../WebhooksPage';

const subActive = {
  id: 'wh_1',
  userId: 'usr_1',
  eventType: 'document.converted' as const,
  targetUrl: 'https://hooks.example.com/active',
  secretPrefix: 'whsec_a',
  status: 'active' as const,
  failureCount: 0,
  lastDeliveryAt: '2026-05-18T00:01:00Z',
  createdAt: '2026-05-17T00:00:00Z',
  updatedAt: '2026-05-18T00:01:00Z',
};

const delivery = {
  id: 'del_1',
  userId: 'usr_1',
  channel: 'webhook' as const,
  target: 'https://hooks.example.com/active',
  status: 'delivered' as const,
  attempts: 1,
  createdAt: '2026-05-18T00:01:00Z',
  updatedAt: '2026-05-18T00:01:01Z',
};

const okEnvelope = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

// Mock both /webhooks and /deliveries calls in one fetch
// stub — order isn't deterministic under Promise.allSettled so
// route by URL substring rather than call sequence.
function mockWebhookFetches(
  fetchSpy: ReturnType<typeof vi.spyOn>,
  opts: {
    subs?: unknown[];
    deliveries?: unknown[];
    failSubs?: boolean;
    failDeliveries?: boolean;
  },
) {
  fetchSpy.mockImplementation(async (input: RequestInfo | URL) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes('/notify/v1/notify/webhooks')) {
      if (opts.failSubs) {
        return new Response(
          JSON.stringify({ success: false, error: { details: 'notify-service down' } }),
          { status: 503, headers: { 'content-type': 'application/json' } },
        );
      }
      return okEnvelope({ subscriptions: opts.subs ?? [] });
    }
    if (url.includes('/notify/v1/notify/deliveries')) {
      if (opts.failDeliveries) {
        return new Response('boom', { status: 503 });
      }
      return okEnvelope({ items: opts.deliveries ?? [] });
    }
    throw new Error(`unmocked fetch: ${url}`);
  });
}

describe('WebhooksPage', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    fetchSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('renders the page header + subscriptions list + delivery section on happy path', async () => {
    mockWebhookFetches(fetchSpy, { subs: [subActive], deliveries: [delivery] });
    render(<WebhooksPage />);

    // Header.
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Webhooks$/ })).toBeInTheDocument();
    });
    // Subscription row landed.
    await waitFor(() => {
      expect(screen.getAllByTestId('webhook-row')).toHaveLength(1);
    });
    // The target URL renders in BOTH the subscriptions list
    // AND the matching delivery row — assert ≥ 1 rather than
    // exactly one, since the actual contract is "the URL
    // landed on the page" not "exactly once".
    expect(screen.getAllByText('https://hooks.example.com/active').length).toBeGreaterThanOrEqual(1);
    // Delivery section heading + row.
    expect(screen.getByRole('heading', { name: /Recent deliveries/i })).toBeInTheDocument();
    expect(screen.getAllByTestId('webhook-delivery-row')).toHaveLength(1);
  });

  it('renders empty subscriptions + empty deliveries states when both lists are empty', async () => {
    mockWebhookFetches(fetchSpy, { subs: [], deliveries: [] });
    render(<WebhooksPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Webhooks$/ })).toBeInTheDocument();
    });
    // The page still renders the section headers + the
    // empty-state hint for deliveries (subscription list owns
    // its own empty state component-side).
    expect(screen.getByText(/No webhook deliveries yet/i)).toBeInTheDocument();
    expect(screen.queryAllByTestId('webhook-row')).toHaveLength(0);
    expect(screen.queryAllByTestId('webhook-delivery-row')).toHaveLength(0);
  });

  it('surfaces a load-error banner with a Retry button when subscriptions fetch fails', async () => {
    mockWebhookFetches(fetchSpy, { failSubs: true });
    render(<WebhooksPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    // The subscriptions list does NOT render while subs is
    // null + we have a loadError (the skeleton is replaced by
    // the error banner + the listed-content is suppressed).
    expect(screen.queryByTestId('webhook-row')).not.toBeInTheDocument();
  });

  it('falls open when only the deliveries fetch fails — subscriptions still render, no banner', async () => {
    mockWebhookFetches(fetchSpy, { subs: [subActive], failDeliveries: true });
    render(<WebhooksPage />);

    await waitFor(() => {
      expect(screen.getAllByTestId('webhook-row')).toHaveLength(1);
    });
    // Deliveries failure must NOT promote to a page-level
    // banner — the contract is that subscriptions are the
    // mutation surface and matter more; deliveries fall back
    // to the empty-state hint.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(/No webhook deliveries yet/i)).toBeInTheDocument();
  });

  it('Retry re-fetches and recovers the page after a transient subscriptions failure', async () => {
    let attempts = 0;
    fetchSpy.mockImplementation(async (input: RequestInfo | URL) => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes('/notify/v1/notify/webhooks')) {
        attempts += 1;
        if (attempts === 1) {
          return new Response('boom', { status: 503 });
        }
        return okEnvelope({ subscriptions: [subActive] });
      }
      if (url.includes('/notify/v1/notify/deliveries')) {
        return okEnvelope({ items: [] });
      }
      throw new Error(`unmocked fetch: ${url}`);
    });

    render(<WebhooksPage />);

    const retry = await screen.findByRole('button', { name: /Retry/i });
    await userEvent.click(retry);

    await waitFor(() => {
      expect(screen.getAllByTestId('webhook-row')).toHaveLength(1);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('opens the New-subscription dialog when the header button is clicked', async () => {
    mockWebhookFetches(fetchSpy, { subs: [], deliveries: [] });
    render(<WebhooksPage />);

    // Wait for the load to finish so the page's "ready" state
    // is mounted and the header button is interactable.
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Webhooks$/ })).toBeInTheDocument();
    });

    expect(screen.queryByRole('heading', { name: /New webhook subscription/i })).not.toBeInTheDocument();

    const newBtn = screen.getByRole('button', { name: /New subscription/i });
    await userEvent.click(newBtn);

    // Dialog renders its own title — assert it appeared.
    expect(
      await screen.findByRole('heading', { name: /New webhook subscription/i }),
    ).toBeInTheDocument();
  });

  it('renders the security explainer + the X-Fyredocs-Signature hint on first paint', async () => {
    mockWebhookFetches(fetchSpy, { subs: [], deliveries: [] });
    render(<WebhooksPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Webhooks$/ })).toBeInTheDocument();
    });
    // The signature header name is in the page-level description.
    // Quoted as <code> so testing-library would match across the
    // surrounding text.
    expect(screen.getByText('X-Fyredocs-Signature')).toBeInTheDocument();
  });
});
