import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LucideIcon } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';

interface StatCardProps {
  label: string;
  value: string | number | null | undefined;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  subtitle?: string;
  color?: string;
  isLoading?: boolean;
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

export function StatCard({ label, value, subtitle, color = 'text-foreground', icon: Icon, iconColor, iconBg, isLoading }: StatCardProps) {
  const parsed = value != null ? parseNumericValue(value) : null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs leading-tight text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-8 w-20" />
          ) : (
            <>
              <p className={`text-3xl font-bold leading-tight ${color}`}>
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
              {subtitle && <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p>}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
