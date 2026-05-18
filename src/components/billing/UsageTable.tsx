import type { UsageRollup } from '@/lib/billingApi';

interface Props {
  /** null when analytics-service was unreachable; empty `items` array
   *  means the user has used nothing this period. */
  usage: UsageRollup | null;
}

/**
 * Current-period usage breakdown by event type. A null `usage`
 * (analytics-service unreachable) renders an inline hint rather
 * than blocking the page — usage data is informational, not
 * gating, per billing-service v0 contract.
 */
export function UsageTable({ usage }: Props) {
  if (usage === null) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        Usage data is temporarily unavailable. Try refreshing in a few moments.
      </div>
    );
  }
  if (usage.items.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        No metered usage for {usage.period} yet. As you process documents and
        make API calls, they'll appear here.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-4 py-2 font-medium">Event type</th>
            <th className="px-4 py-2 font-medium">Unit</th>
            <th className="px-4 py-2 text-right font-medium">Quantity</th>
            <th className="px-4 py-2 text-right font-medium">Events</th>
          </tr>
        </thead>
        <tbody>
          {usage.items.map((row) => (
            <tr key={`${row.eventType}-${row.unit}`} className="border-t">
              <td className="px-4 py-2 font-mono text-xs">{row.eventType}</td>
              <td className="px-4 py-2 text-muted-foreground">{row.unit}</td>
              <td className="px-4 py-2 text-right">{row.totalQuantity.toLocaleString()}</td>
              <td className="px-4 py-2 text-right text-muted-foreground">
                {row.eventCount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
