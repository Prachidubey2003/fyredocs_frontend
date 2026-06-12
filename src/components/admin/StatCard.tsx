import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrendDirection } from '@/lib/adminTrends';
import { AnimatedNumber } from './AnimatedNumber';

export type StatTone = 'default' | 'brand' | 'success' | 'warning' | 'destructive' | 'info';

const TONE_STYLES: Record<StatTone, { icon: string; bg: string }> = {
  default: { icon: 'text-muted-foreground', bg: 'bg-muted' },
  brand: { icon: 'text-primary', bg: 'bg-primary/10' },
  success: { icon: 'text-success', bg: 'bg-success-subtle' },
  warning: { icon: 'text-warning', bg: 'bg-warning-subtle' },
  destructive: { icon: 'text-destructive', bg: 'bg-destructive-subtle' },
  info: { icon: 'text-info', bg: 'bg-info-subtle' },
};

export interface StatTrend {
  deltaPct: number;
  direction: TrendDirection;
  /** Set for metrics where "up" is bad (churn, failures, error rate). */
  invertGood?: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number | null | undefined;
  icon: LucideIcon;
  /** Semantic tone for the icon chip (replaces raw palette classes). */
  tone?: StatTone;
  subtitle?: string;
  /** Token-based class for the value, e.g. "text-success". */
  color?: string;
  isLoading?: boolean;
  /** Half-over-half delta chip; omit when no series is available. */
  trend?: StatTrend;
}

function parseNumericValue(value: string | number): {
  num: number;
  decimals: number;
  prefix: string;
  suffix: string;
} | null {
  if (typeof value === 'number') {
    return { num: value, decimals: 0, prefix: '', suffix: '' };
  }
  const clean = value.replace(/,/g, '');
  const match = clean.match(/^([^0-9\-.]*)([-]?\d+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const prefix = match[1];
  const num = parseFloat(match[2]);
  const suffix = match[3];
  if (isNaN(num)) return null;
  const dotIdx = match[2].indexOf('.');
  const decimals = dotIdx === -1 ? 0 : match[2].length - dotIdx - 1;
  return { num, decimals, prefix, suffix };
}

function TrendChip({ trend }: { trend: StatTrend }) {
  const { deltaPct, direction, invertGood } = trend;
  const isGood = direction === 'flat' ? null : (direction === 'up') !== Boolean(invertGood);
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;
  const toneClass =
    isGood === null
      ? 'bg-muted text-muted-foreground'
      : isGood
        ? 'bg-success-subtle text-success-subtle-foreground'
        : 'bg-destructive-subtle text-destructive-subtle-foreground';
  const label = `${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(1)}% vs previous period`;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-caption font-medium tabular-nums',
        toneClass,
      )}
      title={label}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {`${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(1)}%`}
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function StatCard({
  label,
  value,
  subtitle,
  color = 'text-foreground',
  icon: Icon,
  tone = 'default',
  isLoading,
  trend,
}: StatCardProps) {
  const parsed = value != null ? parseNumericValue(value) : null;
  const toneStyle = TONE_STYLES[tone];

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', toneStyle.bg)}>
          <Icon className={cn('h-5 w-5', toneStyle.icon)} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs leading-tight text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-8 w-20" />
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <p className={cn('text-3xl font-bold leading-tight', color)}>
                  {parsed ? (
                    <AnimatedNumber
                      value={parsed.num}
                      decimals={parsed.decimals}
                      prefix={parsed.prefix}
                      suffix={parsed.suffix}
                    />
                  ) : (
                    value ?? 0
                  )}
                </p>
                {trend && <TrendChip trend={trend} />}
              </div>
              {subtitle && <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p>}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
