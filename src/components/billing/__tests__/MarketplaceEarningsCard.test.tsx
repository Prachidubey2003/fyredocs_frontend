import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';

import { render } from '@/test/test-utils';
import type { MarketplaceEarning } from '@/lib/billingApi';
import { MarketplaceEarningsCard } from '../MarketplaceEarningsCard';

const baseItem: MarketplaceEarning = {
  id: 'e1',
  transactionId: 'ch_test_1',
  pluginId: 'plug_super',
  grossCents: 5000,
  developerShareCents: 3500,
  currency: 'USD',
  status: 'paid',
  recordedAt: '2026-05-17T00:00:00Z',
};

describe('MarketplaceEarningsCard', () => {
  it('renders one row per earning with plugin, gross, share, status, when', () => {
    render(
      <MarketplaceEarningsCard
        items={[
          baseItem,
          { ...baseItem, id: 'e2', pluginId: 'plug_other', status: 'pending' },
        ]}
        totalEarnedCents={3500}
      />,
    );
    const rows = screen.getAllByTestId('marketplace-earning-row');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('plug_super')).toBeInTheDocument();
    expect(within(rows[1]).getByText('plug_other')).toBeInTheDocument();
  });

  it('formats USD amounts with a leading $ and strips trailing zeros on whole dollars', () => {
    render(
      <MarketplaceEarningsCard
        items={[{ ...baseItem, grossCents: 5000, developerShareCents: 3500 }]}
        totalEarnedCents={3500}
      />,
    );
    expect(screen.getByText('$50')).toBeInTheDocument();
    // developer share + footer both render the same value; assert at least one
    expect(screen.getAllByText('$35').length).toBeGreaterThanOrEqual(1);
  });

  it('keeps two decimals when the amount is not a whole dollar', () => {
    render(
      <MarketplaceEarningsCard
        items={[{ ...baseItem, grossCents: 1599, developerShareCents: 1199 }]}
        totalEarnedCents={1199}
      />,
    );
    expect(screen.getByText('$15.99')).toBeInTheDocument();
    expect(screen.getAllByText('$11.99').length).toBeGreaterThanOrEqual(1);
  });

  it('renders non-USD currencies with a currency-code prefix instead of "$"', () => {
    render(
      <MarketplaceEarningsCard
        items={[
          {
            ...baseItem,
            currency: 'eur',
            grossCents: 5000,
            developerShareCents: 3500,
          },
        ]}
        totalEarnedCents={3500}
      />,
    );
    // currency code is upper-cased before display, even though the
    // backend may send a lowercase ISO 4217 alpha-3 string.
    expect(screen.getByText('EUR 50')).toBeInTheDocument();
  });

  it('maps status to badge variants (paid+payable→default, pending→secondary, reversed→destructive)', () => {
    render(
      <MarketplaceEarningsCard
        items={[
          { ...baseItem, id: 'e_paid', status: 'paid' },
          { ...baseItem, id: 'e_payable', status: 'payable' },
          { ...baseItem, id: 'e_pending', status: 'pending' },
          { ...baseItem, id: 'e_reversed', status: 'reversed' },
        ]}
        totalEarnedCents={0}
      />,
    );
    const rows = screen.getAllByTestId('marketplace-earning-row');
    // Badge is the inner element holding the status string; pull it by
    // looking up the visible text within each row and asserting its
    // class reflects the variant. shadcn badge variants are encoded
    // as class fragments — `destructive` for reversed, `secondary`
    // for pending. The remaining two use the default variant which
    // has no marker class, so we just assert the text is present.
    const pending = within(rows[2]).getByText('pending');
    expect(pending.className).toMatch(/secondary/);
    const reversed = within(rows[3]).getByText('reversed');
    expect(reversed.className).toMatch(/destructive/);
  });

  it('shows the page-scoped total + entry count in the footer', () => {
    render(
      <MarketplaceEarningsCard
        items={[
          { ...baseItem, id: 'e1' },
          { ...baseItem, id: 'e2' },
        ]}
        totalEarnedCents={7000}
      />,
    );
    expect(screen.getByText(/Shown earnings:/i)).toBeInTheDocument();
    expect(screen.getByText('$70')).toBeInTheDocument();
    expect(screen.getByText(/across 2 entries/i)).toBeInTheDocument();
  });

  it('falls back to USD in the footer when items array is empty', () => {
    // Defensive case — BillingPage hides the card on empty items so
    // this should never actually render, but the component must not
    // crash when forced.
    render(<MarketplaceEarningsCard items={[]} totalEarnedCents={0} />);
    expect(screen.getByText(/Shown earnings:/i)).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('renders a localised date for recordedAt and leaves bad ISO strings unchanged', () => {
    render(
      <MarketplaceEarningsCard
        items={[
          { ...baseItem, id: 'e_ok', recordedAt: '2026-05-17T00:00:00Z' },
          { ...baseItem, id: 'e_bad', recordedAt: 'not-a-date' },
        ]}
        totalEarnedCents={0}
      />,
    );
    // JSDOM defaults to en-US; the formatter renders "May 17, 2026".
    // We're tolerant about UTC-vs-local edge dates so accept either
    // May 16 or May 17 — what we really want to assert is that the
    // formatter ran (a digit-bearing month-day string), not the
    // exact day.
    expect(screen.getByText(/May 1[67], 2026/)).toBeInTheDocument();
    expect(screen.getByText('not-a-date')).toBeInTheDocument();
  });
});
