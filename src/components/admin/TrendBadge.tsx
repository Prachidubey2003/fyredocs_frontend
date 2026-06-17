import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrendDirection } from '@/lib/adminTrends';

export interface TrendInfo {
  deltaPct: number;
  direction: TrendDirection;
  /** Set for metrics where "up" is bad (churn, failures, error rate, latency). */
  invertGood?: boolean;
}

/**
 * Delta chip used by KPI cards, chart headers, and stat cards. Green when the
 * movement is good for the metric, red when bad, neutral when flat. The good/bad
 * sense flips for `invertGood` metrics.
 */
export function TrendBadge({
  trend,
  className,
  showLabel = false,
}: {
  trend: TrendInfo;
  className?: string;
  /** Append " vs previous period" text after the percentage. */
  showLabel?: boolean;
}) {
  const { deltaPct, direction, invertGood } = trend;
  const isGood = direction === 'flat' ? null : (direction === 'up') !== Boolean(invertGood);
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;
  const toneClass =
    isGood === null
      ? 'bg-muted text-muted-foreground'
      : isGood
        ? 'bg-success-subtle text-success-subtle-foreground'
        : 'bg-destructive-subtle text-destructive-subtle-foreground';
  const pct = `${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(1)}%`;
  const fullLabel = `${pct} vs previous period`;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-caption font-medium tabular-nums',
        toneClass,
        className,
      )}
      title={fullLabel}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {pct}
      {showLabel ? (
        <span className="font-normal text-muted-foreground"> vs prev</span>
      ) : (
        <span className="sr-only">{fullLabel}</span>
      )}
    </span>
  );
}
