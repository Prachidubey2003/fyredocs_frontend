import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MarketplaceEarning, MarketplaceEarningStatus } from '@/lib/billingApi';

interface Props {
  items: MarketplaceEarning[];
  totalEarnedCents: number;
}

/**
 * Read-only dashboard card showing the caller's recent
 * marketplace earnings. Rendered ONLY when the user has at
 * least one entry — the BillingPage hides this card entirely
 * for non-developer users (the vast majority).
 *
 * Visible per entry: pluginId, gross, developer share,
 * status badge, recorded date. The transaction id is shown
 * truncated as a hover-affordance for support traceability;
 * we don't fully expose it (typically a `ch_...` Stripe id)
 * to keep the table compact.
 *
 * Status badge variants:
 *   - paid     → default (informational neutral)
 *   - payable  → default
 *   - pending  → secondary
 *   - reversed → destructive
 *
 * Card footer: `totalEarnedCents` for the page. Documented as
 * "shown earnings" rather than "lifetime" so users don't
 * confuse a 50-item page with their entire history.
 */
export function MarketplaceEarningsCard({ items, totalEarnedCents }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketplace earnings</CardTitle>
        <CardDescription>
          Recent revshare entries from plugin sales. Lifecycle moves{' '}
          <code className="font-mono">pending → payable → paid</code> as the
          chargeback window passes and Stripe Connect transfers settle.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Plugin</th>
                <th className="px-4 py-2 font-medium">Gross</th>
                <th className="px-4 py-2 font-medium">Your share</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t" data-testid="marketplace-earning-row">
                  <td className="px-4 py-2 font-mono text-xs">{item.pluginId}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {formatAmount(item.grossCents, item.currency)}
                  </td>
                  <td className="px-4 py-2 font-medium">
                    {formatAmount(item.developerShareCents, item.currency)}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                    {formatDate(item.recordedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Shown earnings:{' '}
          <span className="font-medium text-foreground">
            {formatAmount(totalEarnedCents, items[0]?.currency ?? 'USD')}
          </span>{' '}
          across {items.length} entries (page total — full lifetime sum lands
          when the payout pipeline ships).
        </p>
      </CardContent>
    </Card>
  );
}

function statusVariant(
  s: MarketplaceEarningStatus,
): 'default' | 'secondary' | 'destructive' {
  if (s === 'reversed') return 'destructive';
  if (s === 'pending') return 'secondary';
  return 'default';
}

// Currency formatting mirrors the existing helper in billingApi
// but accepts an arbitrary code — invoice flows ship in
// non-USD currencies for international developers.
function formatAmount(cents: number, currency: string): string {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const dollars = abs / 100;
  const formatted = dollars.toLocaleString(undefined, {
    minimumFractionDigits: dollars % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  const code = (currency || 'USD').toUpperCase();
  return `${negative ? '-' : ''}${code === 'USD' ? '$' : code + ' '}${formatted}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
