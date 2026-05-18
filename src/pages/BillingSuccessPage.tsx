import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSkeleton } from '@/components/common/PageSkeleton';
import { type MeResponse, getMe } from '@/lib/billingApi';

/**
 * Landing page Stripe redirects to after a successful Checkout
 * Session. The Stripe URL carries `?session_id={CHECKOUT_SESSION_ID}`
 * which we forward to the user-friendly UI but don't otherwise
 * use — the source of truth for "did the subscription land" is
 * `/v1/billing/me`, updated by the webhook handler.
 *
 * Polling cadence: Stripe's webhook usually arrives within 1–2
 * seconds, but the SLA is "within 5 minutes". We poll every 1.5s
 * for up to 30s; past that the page surfaces a "Webhook is slow,
 * we'll show your plan as soon as it lands" hint with a manual
 * refresh. The webhook is the authority — never trust the
 * Checkout Session redirect alone (a user could craft a fake
 * redirect URL).
 */
export default function BillingSuccessPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const sessionID = searchParams.get('session_id');

  const [me, setMe] = useState<MeResponse | null>(null);
  const [pollState, setPollState] = useState<'pending' | 'confirmed' | 'timeout' | 'error'>(
    'pending',
  );

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let cancelled = false;
    const initialPlanCode = me?.plan.code ?? null;
    const attempts = { count: 0 };
    const maxAttempts = 20; // 20 × 1500ms = 30s

    const tick = async () => {
      if (cancelled) return;
      attempts.count += 1;
      try {
        const next = await getMe();
        if (cancelled) return;
        setMe(next);
        // We consider the subscription "confirmed" when EITHER
        // the plan code changed (free → paid) OR the
        // subscription row is present with a non-empty
        // stripeSubscriptionId. The latter handles the
        // already-on-this-plan-but-upgrading-seats case where
        // the plan code stays the same.
        const planChanged = initialPlanCode !== null && next.plan.code !== initialPlanCode;
        const hasStripeSub = Boolean(next.subscription?.stripeSubscriptionId);
        if (planChanged || hasStripeSub) {
          setPollState('confirmed');
          clearInterval(pollInterval);
          return;
        }
      } catch {
        // Transient network blip — keep polling unless we've
        // exhausted the attempt budget.
        if (cancelled) return;
      }
      if (attempts.count >= maxAttempts) {
        setPollState('timeout');
        clearInterval(pollInterval);
      }
    };

    // Start the interval first so `tick` can reference it for
    // early-exit clearing on the "confirmed" / "timeout" paths.
    const pollInterval = setInterval(() => {
      void tick();
    }, 1500);
    void tick();

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
    // We intentionally only re-run the effect on auth changes —
    // the polling owns its own state. me?.plan.code is captured
    // by `initialPlanCode` on first run; later changes shouldn't
    // restart the poll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (authLoading) {
    return <PageSkeleton />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: '/account/billing/success' }} />;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {pollState === 'confirmed' ? 'You’re subscribed' : 'Confirming your subscription'}
          </CardTitle>
          <CardDescription>
            {pollState === 'confirmed'
              ? `You're now on the ${me?.plan.name ?? 'paid'} plan.`
              : pollState === 'timeout'
                ? 'Stripe is taking longer than usual to confirm. Your subscription will appear shortly.'
                : 'Checking with Stripe — this usually takes a second.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pollState === 'pending' && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
            >
              Waiting for Stripe webhook…
            </div>
          )}
          {pollState === 'timeout' && (
            <div
              role="alert"
              className="rounded-md border border-amber-500/40 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
            >
              The webhook hasn't arrived yet. Your card was charged successfully — refresh in a
              moment to see the updated plan, or contact support if it takes more than a few
              minutes.
            </div>
          )}
          {sessionID && (
            <p className="break-all text-xs text-muted-foreground">
              Stripe session: <code>{sessionID}</code>
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <Button asChild variant="default">
              <Link to="/account/billing">Back to billing</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Go to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
