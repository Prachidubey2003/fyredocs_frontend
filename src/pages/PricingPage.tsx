import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Zap, Building, Users, Briefcase, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Plan, formatPrice, listPlans } from '@/lib/billingApi';

// Marketing copy lives here, in the frontend — NOT in the
// backend plan registry, which holds structured pricing/limits.
// One variant per plan_code. A plan present in the backend
// registry but missing from this map renders with name + price
// only (a defensive fallback so newly-launched plans don't
// crash the page).
const planVariants: Record<
  string,
  {
    Icon: typeof Zap;
    tagline: string;
    features: string[];
    cta: string;
    href: string;
    popular?: boolean;
  }
> = {
  free: {
    Icon: Zap,
    tagline: 'For occasional PDF tasks',
    features: [
      '5 files per day',
      'Max 10MB per file',
      'Basic tools (merge, split)',
      'Standard processing speed',
      'Email support',
    ],
    cta: 'Get Started',
    href: '/signup',
  },
  pro: {
    Icon: Briefcase,
    tagline: 'For professionals',
    features: [
      'Unlimited files',
      'Max 100MB per file',
      'All tools including OCR',
      'Priority processing',
      'Batch processing',
      'Priority email support',
      'No watermarks',
    ],
    cta: 'Start free trial',
    href: '/signup?plan=pro',
    popular: true,
  },
  teams: {
    Icon: Users,
    tagline: 'For small teams',
    features: [
      'Everything in Pro',
      'Shared workspaces',
      'Multi-user collaboration',
      'Comments & suggestions',
      '100GB pooled storage',
      '500 AI credits per user / mo',
    ],
    cta: 'Start free trial',
    href: '/signup?plan=teams',
  },
  business: {
    Icon: Building,
    tagline: 'For growing organizations',
    features: [
      'Everything in Teams',
      'SSO (SAML / OIDC)',
      'Audit log + DLP',
      'Advanced workflows',
      '2000 AI credits per user / mo',
      'Standard SLA',
    ],
    cta: 'Start free trial',
    href: '/signup?plan=business',
  },
  enterprise: {
    Icon: InfinityIcon,
    tagline: 'For organizations at scale',
    features: [
      'Everything in Business',
      'HIPAA / SOC2 compliance',
      'BYOK customer-managed keys',
      'Data residency (US/EU/IN/AU)',
      'Dedicated support',
      'Custom SLA',
      'On-premise option',
    ],
    cta: 'Contact sales',
    href: '/contact',
  },
};

const PricingPage = () => {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    listPlans()
      .then(setPlans)
      .catch((err: unknown) => {
        // A pricing-page outage with hard-coded fallbacks
        // would be sales-killing; the page is still readable
        // (with the marketing variants) even when the
        // backend is unreachable — see the empty-data render
        // below.
        setLoadError(err instanceof Error ? err.message : 'Failed to load plans.');
      });
  }, []);

  // Render order is the order returned by the backend (cheapest
  // first, Enterprise last). Filter out any backend plan that
  // doesn't have a marketing variant defined — those are
  // experimental tiers not ready for the public pricing page.
  const ordered = (plans ?? []).filter((p) => planVariants[p.code]);

  return (
    <>
      <Helmet>
        <title>Pricing — Fyredocs</title>
        <meta
          name="description"
          content="Simple, transparent pricing for Fyredocs PDF tools. Free plan available. Upgrade anytime."
        />
      </Helmet>
      <div className="container py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Simple, Transparent{' '}
            <span className="text-gradient-primary">Pricing</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {loadError && (
          <p
            className="mx-auto mb-6 max-w-3xl rounded-md border border-amber-500/40 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
            role="alert"
          >
            Couldn't load the live plan list ({loadError}). The plans below may
            be out of date — please contact sales for current pricing.
          </p>
        )}

        {plans === null ? (
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[480px] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {ordered.map((plan) => {
              const variant = planVariants[plan.code];
              const Icon = variant.Icon;
              const priceLabel = formatPriceLabel(plan);
              return (
                <Card
                  key={plan.code}
                  className={cn(
                    'relative flex flex-col',
                    variant.popular && 'border-primary shadow-lg lg:scale-105',
                  )}
                >
                  {variant.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                        Most popular
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{variant.tagline}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col space-y-6">
                    <div className="text-center">
                      <span className="text-4xl font-bold">{priceLabel.amount}</span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        {priceLabel.period}
                      </span>
                    </div>
                    <ul className="space-y-3 flex-1">
                      {variant.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={cn(
                        'w-full',
                        variant.popular && 'bg-gradient-primary',
                      )}
                      variant={variant.popular ? 'default' : 'outline'}
                      asChild
                    >
                      <Link to={variant.href}>{variant.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            All plans include SSL encryption, secure file handling, and
            automatic file deletion after processing.
          </p>
        </div>
      </div>
    </>
  );
};

// formatPriceLabel renders a `Plan` into the two-part display
// the card uses: a big number ("$15" / "Free" / "Custom") and a
// period suffix ("per user / month", "forever", "contact us").
// Lives next to the component because no other page renders
// this exact two-part shape — keeping it inline avoids a
// shared file that does one thing.
function formatPriceLabel(plan: Plan): { amount: string; period: string } {
  if (plan.monthlyPriceCents < 0) {
    return { amount: 'Custom', period: 'contact us' };
  }
  if (plan.monthlyPriceCents === 0) {
    return { amount: 'Free', period: 'forever' };
  }
  // billingApi.formatPrice returns the bare `$15` / `$15.99`
  // shape; no currency-code prefix to strip. Show monthly
  // even when yearly is also defined — yearly savings get a
  // separate "Save 20% annually" badge in a follow-up.
  return {
    amount: formatPrice(plan.monthlyPriceCents),
    period: plan.perSeat ? 'per user / month' : 'per month',
  };
}

export default PricingPage;
