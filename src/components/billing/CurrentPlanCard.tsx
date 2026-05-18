import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type MeResponse, formatPrice } from '@/lib/billingApi';

interface Props {
  me: MeResponse;
}

/**
 * Top section of the billing page. Shows the active plan name,
 * price, status, and renewal date. Renders for both subscribers
 * and the default-Free flow (subscription === null).
 *
 * Status badge uses semantic colors:
 *   - active   → default (green-ish in shadcn)
 *   - past_due → destructive (red)
 *   - canceled → secondary (muted)
 *   - none     → secondary "Free tier"
 */
export function CurrentPlanCard({ me }: Props) {
  const { plan, subscription } = me;
  const renewsAt = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd)
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-xl">{plan.name}</CardTitle>
          <StatusBadge subscription={subscription} />
        </div>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Price</span>
          <span className="font-medium">
            {formatPrice(plan.monthlyPriceCents)}
            {plan.monthlyPriceCents > 0 ? (plan.perSeat ? ' / user / mo' : ' / mo') : ''}
          </span>
        </div>
        {subscription && (
          <>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Seats</span>
              <span className="font-medium">{subscription.seats}</span>
            </div>
            {renewsAt && !Number.isNaN(renewsAt.getTime()) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {subscription.status === 'canceled' ? 'Access ends' : 'Renews'}
                </span>
                <span className="font-medium">
                  {renewsAt.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ subscription }: { subscription?: MeResponse['subscription'] }) {
  if (!subscription) {
    return <Badge variant="secondary">Free tier</Badge>;
  }
  switch (subscription.status) {
    case 'active':
      return <Badge>Active</Badge>;
    case 'past_due':
      return <Badge variant="destructive">Past due</Badge>;
    case 'canceled':
      return <Badge variant="secondary">Canceled</Badge>;
    default:
      return <Badge variant="outline">{subscription.status}</Badge>;
  }
}
