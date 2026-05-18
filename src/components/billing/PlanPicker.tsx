import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type Plan, formatPrice } from '@/lib/billingApi';

interface Props {
  plans: Plan[];
  currentCode: string;
  busy: boolean;
  onSwitch: (planCode: string) => void;
}

/**
 * Grid of plan tiles. Each tile shows price + description + a CTA
 * that depends on the plan's relationship to the current one:
 *
 *   - current plan      → "Current plan" (disabled).
 *   - self-serve plan   → "Switch" (POSTs /v1/billing/me/subscribe).
 *   - sales-led plan    → "Contact sales" mailto link (no API call).
 *
 * The grid renders responsive — single column on mobile, up to
 * three across on wide screens.
 */
export function PlanPicker({ plans, currentCode, busy, onSwitch }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => {
        const isCurrent = plan.code === currentCode;
        return (
          <Card key={plan.code} className={isCurrent ? 'border-primary' : ''}>
            <CardHeader>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <div className="text-2xl font-semibold">
                {formatPrice(plan.monthlyPriceCents)}
                {plan.monthlyPriceCents > 0 && (
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    {plan.perSeat ? '/ user / mo' : '/ mo'}
                  </span>
                )}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {renderAction({ plan, isCurrent, busy, onSwitch })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface ActionProps {
  plan: Plan;
  isCurrent: boolean;
  busy: boolean;
  onSwitch: (planCode: string) => void;
}

function renderAction({ plan, isCurrent, busy, onSwitch }: ActionProps) {
  if (isCurrent) {
    return (
      <Button className="w-full" disabled variant="secondary">
        Current plan
      </Button>
    );
  }
  if (!plan.selfServe) {
    return (
      <Button className="w-full" variant="outline" asChild>
        <a href={`mailto:sales@fyredocs.com?subject=${encodeURIComponent(`Inquiry about the ${plan.name} plan`)}`}>
          Contact sales
        </a>
      </Button>
    );
  }
  return (
    <Button
      className="w-full"
      disabled={busy}
      onClick={() => onSwitch(plan.code)}
    >
      {busy ? 'Switching…' : 'Switch'}
    </Button>
  );
}
