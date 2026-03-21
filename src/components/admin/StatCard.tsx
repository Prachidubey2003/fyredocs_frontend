import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedNumber } from './AnimatedNumber';

interface StatCardProps {
  label: string;
  value: string | number | null | undefined;
  subtitle?: string;
  color?: string;
  isLoading?: boolean;
}

/**
 * Parses a display value like "45.2%", "120ms", "3.50 GB", or "1,234" and
 * returns { num, decimals, prefix, suffix } so AnimatedNumber can animate it.
 */
function parseNumericValue(value: string | number): {
  num: number;
  decimals: number;
  prefix: string;
  suffix: string;
} | null {
  if (typeof value === 'number') {
    return { num: value, decimals: 0, prefix: '', suffix: '' };
  }
  // Remove commas (locale formatting) before parsing
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

export function StatCard({ label, value, subtitle, color = 'text-foreground', isLoading }: StatCardProps) {
  const parsed = value != null ? parseNumericValue(value) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <p className={`text-3xl font-bold ${color}`}>
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
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
