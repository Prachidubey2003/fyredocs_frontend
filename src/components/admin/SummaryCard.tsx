import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface SummaryCardProps {
  title: string;
  icon: ReactNode;
  to: string;
  stats: { label: string; value: string | number; color?: string }[];
  chart?: ReactNode;
  isLoading?: boolean;
}

export function SummaryCard({ title, icon, to, stats, chart, isLoading }: SummaryCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
        ) : (
          <>
            <div className="space-y-1">
              {stats.map((s) => (
                <div key={s.label} className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <span className={`text-lg font-semibold ${s.color ?? ''}`}>{s.value}</span>
                </div>
              ))}
            </div>
            {chart && <div className="h-16">{chart}</div>}
          </>
        )}
        <Button variant="ghost" size="sm" asChild className="mt-auto w-full justify-between">
          <Link to={to}>
            View Details <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
