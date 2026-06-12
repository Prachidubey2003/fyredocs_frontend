import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { AnimatedNumber } from './AnimatedNumber';
import { MetricsErrorState } from './MetricsErrorState';

interface SummaryCardProps {
  title: string;
  icon: ReactNode;
  to: string;
  stats: { label: string; value: string | number; color?: string }[];
  chart?: ReactNode;
  isLoading?: boolean;
  /** Replaces the card body with a compact retryable error state. */
  error?: boolean;
  onRetry?: () => void;
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
  const num = parseFloat(match[2]);
  if (isNaN(num)) return null;
  const prefix = match[1];
  const suffix = match[3];
  const dotIdx = match[2].indexOf('.');
  const decimals = dotIdx === -1 ? 0 : match[2].length - dotIdx - 1;
  return { num, decimals, prefix, suffix };
}

export function SummaryCard({ title, icon, to, stats, chart, isLoading, error, onRetry }: SummaryCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
          <Button variant="outline" size="icon" asChild className="ml-auto h-7 w-7">
            <Link to={to}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        {error ? (
          <MetricsErrorState
            compact
            title={`Failed to load ${title.toLowerCase()} metrics`}
            onRetry={onRetry}
            className="py-4"
          />
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-baseline justify-between gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
            <div className="flex h-24 items-center justify-center">
              <Skeleton className="h-20 w-full max-w-[200px] rounded-md" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              {stats.map((s) => {
                const parsed = parseNumericValue(s.value);
                return (
                  <div key={s.label} className="flex items-baseline justify-between gap-2">
                    <span className="text-sm text-muted-foreground">{s.label}</span>
                    <span className={`text-lg font-semibold ${s.color ?? ''}`}>
                      {parsed ? (
                        <AnimatedNumber
                          value={parsed.num}
                          decimals={parsed.decimals}
                          prefix={parsed.prefix}
                          suffix={parsed.suffix}
                        />
                      ) : (
                        s.value
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            {chart && <div className="flex h-24 items-center justify-center">{chart}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
