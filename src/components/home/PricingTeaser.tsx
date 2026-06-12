import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Heading, Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { usePlans } from '@/hooks/usePlans';
import {
  PLAN_TIERS,
  formatFileSize,
  formatRetention,
  resolvePlanLimits,
} from '@/components/pricing/planContent';

export const PricingTeaser = () => {
  const { data: plans } = usePlans();

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <Heading level="h2" responsive className="mb-3">
            Start free, upgrade when you need more
          </Heading>
          <Text variant="body-lg" tone="muted">
            Every tool works without an account. Plans only change your limits.
          </Text>
        </div>

        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3 md:gap-6">
          {PLAN_TIERS.map((tier) => {
            const limits = resolvePlanLimits(tier, plans);
            return (
              <Link
                key={tier.id}
                to="/pricing"
                className={cn(
                  'group rounded-2xl border bg-card p-6 transition-all duration-base hover:shadow-md',
                  tier.highlighted && 'border-primary',
                )}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Heading level="h4" as="h3">
                    {tier.name}
                  </Heading>
                  {tier.highlighted && <Badge variant="info">Best value</Badge>}
                </div>
                <ul className="space-y-1.5">
                  <li>
                    <Text as="span" variant="body-sm" tone="muted">
                      Up to {formatFileSize(limits.maxFileSizeMb)} per file
                    </Text>
                  </li>
                  <li>
                    <Text as="span" variant="body-sm" tone="muted">
                      {limits.maxFilesPerJob} files per job
                    </Text>
                  </li>
                  <li>
                    <Text as="span" variant="body-sm" tone="muted">
                      Retention: {formatRetention(limits.retentionDays).toLowerCase()}
                    </Text>
                  </li>
                </ul>
                <div className="mt-4 flex items-center gap-1.5 text-body-sm font-medium text-primary">
                  See pricing
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
