import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/auth/useAuth';
import { PageSkeleton } from '@/components/common/PageSkeleton';
import { CurrentPlanCard } from '@/components/billing/CurrentPlanCard';
import { MarketplaceEarningsCard } from '@/components/billing/MarketplaceEarningsCard';
import { UsageTable } from '@/components/billing/UsageTable';
import { PlanPicker } from '@/components/billing/PlanPicker';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import {
  type MarketplaceEarningsResponse,
  type MeResponse,
  type Plan,
  createCheckoutSession,
  getMe,
  listMarketplaceEarnings,
  listPlans,
  subscribe,
} from '@/lib/billingApi';

/**
 * Account → Billing & usage page.
 *
 * Authenticated-only. Loads `/v1/billing/me` and `/v1/billing/plans`
 * in parallel on mount, renders three sections:
 *
 *   1. CurrentPlanCard — shows the active plan + subscription state.
 *   2. UsageTable      — current-period rollup from analytics-service.
 *                        Renders an "unavailable" hint when the server
 *                        couldn't reach analytics (per billing-service
 *                        v0 contract).
 *   3. PlanPicker      — tile-grid of self-serve plans with a Switch
 *                        button. Hidden Enterprise is shown as a
 *                        "Contact sales" tile.
 *
 * Subscribe action mutates local state in place — no refetch.
 */
export default function BillingPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [earnings, setEarnings] = useState<MarketplaceEarningsResponse | null>(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [switching, setSwitching] = useState(false);

  const refresh = useCallback(async () => {
    setLoadError('');
    // me + plans are required for the page; earnings is a
    // bonus tile that the vast majority of users have no
    // entries for. Use allSettled so a marketplace-earnings
    // failure doesn't block the rest of the page.
    const [meRes, plansRes, earningsRes] = await Promise.allSettled([
      getMe(),
      listPlans(),
      listMarketplaceEarnings({ limit: 25 }),
    ]);
    if (meRes.status === 'fulfilled') {
      setMe(meRes.value);
    } else {
      setLoadError(
        meRes.reason instanceof Error
          ? meRes.reason.message
          : 'Failed to load billing data.',
      );
    }
    if (plansRes.status === 'fulfilled') {
      setPlans(plansRes.value);
    }
    if (earningsRes.status === 'fulfilled') {
      setEarnings(earningsRes.value);
    } else {
      // Non-developers will see this as "no entries" rather
      // than as an error — the card stays hidden either way.
      setEarnings({ items: [], totalEarnedCents: 0 });
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void refresh();
  }, [isAuthenticated, refresh]);

  const handleSwitch = useCallback(
    async (planCode: string) => {
      if (switching) return;
      setSwitching(true);
      setActionError('');
      try {
        if (planCode === 'free') {
          // Free has no Stripe presence — apply directly.
          const sub = await subscribe({ planCode });
          const newPlan = plans.find((p) => p.code === planCode) ?? me?.plan;
          if (newPlan) {
            setMe((current) =>
              current ? { ...current, plan: newPlan, subscription: sub } : current,
            );
          }
          setSwitching(false);
          return;
        }
        // Paid plan: kick off Stripe Checkout. The browser
        // navigates to Stripe's hosted page; on success Stripe
        // redirects back to /account/billing/success and the
        // backend webhook updates our Subscription row before
        // (or shortly after) we land there.
        // Intentionally leave `switching=true` — the navigation
        // is in flight and we don't want a second click to fire
        // during the millisecond before window.location takes.
        const session = await createCheckoutSession({ planCode });
        if (!session.url) {
          throw new Error('Stripe did not return a checkout URL.');
        }
        // window.location.assign keeps the page in the back
        // stack; the user can hit "back" to abandon checkout
        // and land here without re-auth.
        window.location.assign(session.url);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to switch plan.');
        setSwitching(false);
      }
    },
    [switching, plans, me?.plan],
  );

  if (authLoading) {
    return <PageSkeleton />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: '/account/billing' }} />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <SettingsTabs />
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Billing &amp; usage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your subscription plan, current-period usage, and available tiers.
        </p>
      </header>

      {loadError && (
        <div
          className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {loadError}{' '}
          <button
            type="button"
            onClick={() => void refresh()}
            className="ml-2 underline-offset-2 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {me === null && !loadError ? (
        <PageSkeleton />
      ) : me ? (
        <div className="space-y-8">
          <CurrentPlanCard me={me} />
          {earnings && earnings.items.length > 0 && (
            <MarketplaceEarningsCard
              items={earnings.items}
              totalEarnedCents={earnings.totalEarnedCents}
            />
          )}
          <section>
            <h2 className="mb-3 text-lg font-medium">Current period usage</h2>
            <UsageTable usage={me.usage ?? null} />
          </section>
          <section>
            <h2 className="mb-3 text-lg font-medium">Switch plan</h2>
            {actionError && (
              <p
                className="mb-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {actionError}
              </p>
            )}
            <PlanPicker
              plans={plans}
              currentCode={me.plan.code}
              busy={switching}
              onSwitch={(code) => void handleSwitch(code)}
            />
          </section>
        </div>
      ) : null}
    </div>
  );
}
