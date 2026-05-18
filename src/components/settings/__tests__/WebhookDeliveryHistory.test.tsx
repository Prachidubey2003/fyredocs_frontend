import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';

import { render } from '@/test/test-utils';
import type { WebhookDelivery } from '@/lib/webhooksApi';
import { WebhookDeliveryHistory } from '../WebhookDeliveryHistory';

const baseDelivery: WebhookDelivery = {
  id: 'd1',
  userId: 'u1',
  channel: 'webhook',
  target: 'https://hooks.example.com/fyredocs',
  status: 'delivered',
  attempts: 1,
  createdAt: '2026-05-18T00:00:00Z',
  updatedAt: '2026-05-18T00:00:01Z',
};

describe('WebhookDeliveryHistory', () => {
  it('renders the dashed empty-state hint when the list is empty', () => {
    render(<WebhookDeliveryHistory deliveries={[]} />);
    expect(screen.getByText(/No webhook deliveries yet/i)).toBeInTheDocument();
    // The table is NOT rendered in the empty state — confirms
    // the early-return path (rather than rendering a 0-row
    // <table> which would be visually noisier).
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders one row per delivery with target, status, attempts visible', () => {
    render(
      <WebhookDeliveryHistory
        deliveries={[
          baseDelivery,
          { ...baseDelivery, id: 'd2', target: 'https://other.example.com/hook', attempts: 3 },
        ]}
      />,
    );
    const rows = screen.getAllByTestId('webhook-delivery-row');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('https://hooks.example.com/fyredocs')).toBeInTheDocument();
    expect(within(rows[1]).getByText('https://other.example.com/hook')).toBeInTheDocument();
    expect(within(rows[1]).getByText('3')).toBeInTheDocument();
  });

  it('renders the lastError column only for failed deliveries', () => {
    const failed: WebhookDelivery = {
      ...baseDelivery,
      id: 'd_fail',
      status: 'failed',
      attempts: 5,
      lastError: 'connection refused at hook.example.com:443',
    };
    const delivered: WebhookDelivery = {
      ...baseDelivery,
      id: 'd_ok',
      // A delivered row carrying a stray lastError (legacy DB
      // rows where the receiver later flipped to success)
      // must NOT show the error — only `status: 'failed'`
      // surfaces it.
      lastError: 'this should be hidden',
    };
    render(<WebhookDeliveryHistory deliveries={[failed, delivered]} />);

    // The failed row carries its error verbatim.
    expect(screen.getByText(/connection refused at hook\.example\.com:443/i)).toBeInTheDocument();
    // The delivered row's stale lastError is suppressed.
    expect(screen.queryByText(/this should be hidden/i)).not.toBeInTheDocument();
  });

  it('maps status to badge variants (delivered→default, pending/skipped→secondary, failed→destructive)', () => {
    render(
      <WebhookDeliveryHistory
        deliveries={[
          { ...baseDelivery, id: 'd_delivered', status: 'delivered' },
          { ...baseDelivery, id: 'd_pending', status: 'pending' },
          { ...baseDelivery, id: 'd_skipped', status: 'skipped' },
          { ...baseDelivery, id: 'd_failed', status: 'failed' },
        ]}
      />,
    );
    const rows = screen.getAllByTestId('webhook-delivery-row');
    // The badge variants land as Tailwind utility classes on
    // the badge element. shadcn's `destructive` and
    // `secondary` variants each tag the badge with a marker
    // class fragment — assert against that.
    const pendingBadge = within(rows[1]).getByText('pending');
    expect(pendingBadge.className).toMatch(/secondary/);
    const skippedBadge = within(rows[2]).getByText('skipped');
    expect(skippedBadge.className).toMatch(/secondary/);
    const failedBadge = within(rows[3]).getByText('failed');
    expect(failedBadge.className).toMatch(/destructive/);
    // `delivered` uses the default variant which has no
    // marker class — assert by absence of secondary/destructive
    // tokens.
    const deliveredBadge = within(rows[0]).getByText('delivered');
    expect(deliveredBadge.className).not.toMatch(/secondary|destructive/);
  });

  it('renders a localised date for createdAt and falls back to the raw ISO on unparseable input', () => {
    render(
      <WebhookDeliveryHistory
        deliveries={[
          { ...baseDelivery, id: 'd_ok', createdAt: '2026-05-18T00:00:00Z' },
          { ...baseDelivery, id: 'd_bad', createdAt: 'not-a-date' },
        ]}
      />,
    );
    // JSDOM defaults to en-US locale; "May 18, 2026" is the
    // expected format from toLocaleString. We accept ±1 day
    // for UTC→local edge cases.
    const rows = screen.getAllByTestId('webhook-delivery-row');
    expect(within(rows[0]).getByText(/May 1[78], 2026/)).toBeInTheDocument();
    // Unparseable ISO surfaces verbatim — pins the
    // Number.isNaN(d.getTime()) fall-through.
    expect(within(rows[1]).getByText('not-a-date')).toBeInTheDocument();
  });
});
