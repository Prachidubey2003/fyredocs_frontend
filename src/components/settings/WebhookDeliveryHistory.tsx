import { Badge } from '@/components/ui/badge';
import type { WebhookDelivery } from '@/lib/webhooksApi';

interface Props {
  deliveries: WebhookDelivery[];
}

/**
 * Compact audit log of recent webhook deliveries. Read-only —
 * the user uses this to debug "did Fyredocs actually try, and
 * what did the receiver say".
 *
 * One row per dispatch attempt. Columns:
 *   - target URL (truncated)
 *   - status badge (delivered / failed / pending / skipped)
 *   - last_error (only meaningful on `failed`)
 *   - attempts count
 *   - created_at
 *
 * Empty state matches the subscriptions-list empty state: a
 * dashed-border note rather than an empty table.
 */
export function WebhookDeliveryHistory({ deliveries }: Props) {
  if (deliveries.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        No webhook deliveries yet. Once Fyredocs fires an event to one of your subscriptions,
        the result lands here — success or failure.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-4 py-2 font-medium">Target</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Attempts</th>
            <th className="px-4 py-2 font-medium">Result</th>
            <th className="px-4 py-2 font-medium">When</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((d) => (
            <tr key={d.id} className="border-t align-top" data-testid="webhook-delivery-row">
              <td className="px-4 py-2 break-all text-xs text-muted-foreground">{d.target}</td>
              <td className="px-4 py-2">
                <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
              </td>
              <td className="px-4 py-2 text-muted-foreground">{d.attempts}</td>
              <td className="px-4 py-2 text-xs text-destructive max-w-[28rem] truncate">
                {d.status === 'failed' && d.lastError ? d.lastError : ''}
              </td>
              <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                {formatDate(d.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// statusVariant maps Delivery.status to one of the Badge
// variants. `failed` reads as destructive; `pending` /
// `skipped` ride the muted secondary; `delivered` is the
// default (green-ish via Tailwind tokens).
function statusVariant(s: WebhookDelivery['status']): 'default' | 'secondary' | 'destructive' {
  if (s === 'failed') return 'destructive';
  if (s === 'pending' || s === 'skipped') return 'secondary';
  return 'default';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
