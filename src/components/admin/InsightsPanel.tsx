import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import {
  DOMAIN_LABEL,
  DOMAIN_PATH,
  type Insight,
  type InsightSeverity,
} from '@/lib/insights';

const SEVERITY_STYLE: Record<
  InsightSeverity,
  { border: string; icon: typeof Info; iconClass: string }
> = {
  critical: { border: 'border-l-destructive', icon: AlertTriangle, iconClass: 'text-destructive' },
  warning: { border: 'border-l-warning', icon: TrendingDown, iconClass: 'text-warning' },
  info: { border: 'border-l-info', icon: Info, iconClass: 'text-info' },
  positive: { border: 'border-l-success', icon: CheckCircle2, iconClass: 'text-success' },
};

function InsightRow({ insight, showDomain }: { insight: Insight; showDomain?: boolean }) {
  const style = SEVERITY_STYLE[insight.severity];
  const Icon = style.icon;

  return (
    <li className={cn('rounded-md border-l-2 bg-muted/30 p-3', style.border)}>
      <div className="flex items-start gap-2.5">
        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', style.iconClass)} aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-snug text-foreground">{insight.title}</p>
            {showDomain && (
              <Link
                to={DOMAIN_PATH[insight.domain]}
                className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-caption font-medium text-muted-foreground hover:text-foreground"
              >
                {DOMAIN_LABEL[insight.domain]}
              </Link>
            )}
          </div>
          <p className="text-caption leading-snug text-muted-foreground">{insight.impact}</p>
          <p className="flex items-start gap-1 text-caption leading-snug text-muted-foreground">
            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            <span>{insight.suggestedAction}</span>
          </p>
        </div>
      </div>
    </li>
  );
}

/**
 * Severity-sorted list of insights. Pass `showDomain` on the overview to label
 * and link each insight to its section. Already-sorted input is preserved.
 */
export function InsightsPanel({
  insights,
  title = 'Insights',
  description,
  showDomain = false,
  isLoading = false,
  emptyMessage = 'No issues detected — metrics are within expected ranges.',
  className,
}: {
  insights: Insight[];
  title?: string;
  description?: string;
  showDomain?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}) {
  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 p-4 pb-2">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden />
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          {description && <p className="truncate text-caption text-muted-foreground">{description}</p>}
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-2">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 text-center">
            <CheckCircle2 className="h-6 w-6 text-success/60" aria-hidden />
            <p className="max-w-[16rem] text-caption text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {insights.map((insight) => (
              <InsightRow key={insight.id} insight={insight} showDomain={showDomain} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
