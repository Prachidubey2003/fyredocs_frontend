import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';
import { Sparkline } from '@/components/admin/charts/Sparkline';
import { TrendBadge } from '@/components/admin/TrendBadge';
import { STATUS_BG, STATUS_COLORS, type HealthStatus } from '@/components/admin/chartTheme';
import type { TrendDirection } from '@/lib/adminTrends';

export interface KpiCardProps {
  label: string;
  /** Pre-formatted current value (e.g. "94.2%", "$12.4K", "1,204"). */
  value: string;
  /** Sparkline series (current period). */
  sparkline?: number[];
  /** Period-over-period delta, percent. Omit to hide the chip. */
  deltaPct?: number | null;
  /** "up" is bad for this metric (error rate, churn). */
  invertGood?: boolean;
  /** Operational status driving the dot + sparkline color. */
  status?: HealthStatus;
  /** One-line plain-language takeaway. */
  insight?: string;
  /** Drill-down target; renders the card as a link with a hover affordance. */
  to?: string;
  isLoading?: boolean;
}

const FLAT_THRESHOLD = 0.5;

function directionOf(deltaPct: number): TrendDirection {
  if (Math.abs(deltaPct) < FLAT_THRESHOLD) return 'flat';
  return deltaPct > 0 ? 'up' : 'down';
}

/**
 * Executive KPI tile: large value, period-over-period trend chip, sparkline,
 * status dot, and a one-line insight. Optionally links to its section page.
 */
export function KpiCard({
  label,
  value,
  sparkline,
  deltaPct,
  invertGood,
  status = 'healthy',
  insight,
  to,
  isLoading,
}: KpiCardProps) {
  const sparkColor = STATUS_COLORS[status];
  const sparkData = (sparkline ?? []).map((v) => ({ value: v }));

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_BG[status])} aria-hidden />
          <span className="truncate text-caption font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
        </div>
        {to && (
          <ArrowUpRight
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-foreground"
            aria-hidden
          />
        )}
      </div>

      {isLoading ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <div className="mt-1.5 flex items-end justify-between gap-2">
          <span className="text-2xl font-semibold leading-none tracking-tight tabular-nums text-foreground">
            {value}
          </span>
          {deltaPct != null && Number.isFinite(deltaPct) && (
            <TrendBadge
              trend={{ deltaPct, direction: directionOf(deltaPct), invertGood }}
              className="mb-0.5"
            />
          )}
        </div>
      )}

      {!isLoading && sparkData.length >= 2 && (
        <Sparkline data={sparkData} color={sparkColor} height={32} className="mt-3" />
      )}

      {!isLoading && insight && (
        <p className="mt-2 line-clamp-2 text-caption leading-snug text-muted-foreground">{insight}</p>
      )}
    </>
  );

  const cardClass = cn(
    'group flex flex-col p-4 transition-colors',
    to && 'cursor-pointer hover:border-primary/40 hover:bg-muted/30',
  );

  if (to) {
    return (
      <Link to={to} aria-label={`${label}: ${value}. View details`} className="block">
        <Card className={cardClass}>{body}</Card>
      </Link>
    );
  }

  return <Card className={cardClass}>{body}</Card>;
}
