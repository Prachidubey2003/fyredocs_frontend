import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { TrendBadge, type TrendInfo } from '@/components/admin/TrendBadge';
import { exportCsv, type CsvColumn } from '@/lib/exportCsv';
import { cn } from '@/lib/utils';
import { Download, LineChart as LineChartIcon } from 'lucide-react';

export interface ChartExport {
  filename: string;
  rows: Record<string, unknown>[];
  columns?: CsvColumn[];
}

interface ChartCardProps {
  title: string;
  description?: string;
  /** Trend chip rendered beside the title. */
  trend?: TrendInfo;
  /** Extra controls (toggles, legends) rendered in the header's right slot. */
  toolbar?: ReactNode;
  /** When set, shows a CSV download button wired to this data. */
  exportData?: ChartExport;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  /**
   * True when the backend has not yet delivered the data for this chart
   * (e.g. an endpoint not yet deployed). Renders an "awaiting data" slot
   * instead of an error.
   */
  awaitingData?: boolean;
  awaitingMessage?: string;
  /** Body height. Defaults to a comfortable 300px. */
  bodyHeight?: number | string;
  /** Footer slot — legends, insight chips, "collecting since" notes. */
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Universal chart container: card chrome with a title row (trend chip, toolbar,
 * CSV export), a fixed-height body, and built-in loading / error / awaiting-data
 * states. Replaces the copy-pasted Card→Skeleton→ChartContainer blocks.
 */
export function ChartCard({
  title,
  description,
  trend,
  toolbar,
  exportData,
  isLoading,
  isError,
  onRetry,
  awaitingData,
  awaitingMessage = 'Awaiting data — this metric is not yet available.',
  bodyHeight = 300,
  footer,
  className,
  children,
}: ChartCardProps) {
  const height = typeof bodyHeight === 'number' ? `${bodyHeight}px` : bodyHeight;

  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-medium text-foreground">{title}</h3>
            {trend && <TrendBadge trend={trend} />}
          </div>
          {description && (
            <p className="mt-0.5 truncate text-caption text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {toolbar}
          {exportData && exportData.rows.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => exportCsv(exportData.filename, exportData.rows, exportData.columns)}
              aria-label="Export as CSV"
              title="Export as CSV"
            >
              <Download className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-4 pt-2">
        <div className="relative w-full" style={{ height }}>
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : isError ? (
            <div className="flex h-full items-center justify-center">
              <MetricsErrorState compact onRetry={onRetry} />
            </div>
          ) : awaitingData ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 text-center">
              <LineChartIcon className="h-6 w-6 text-muted-foreground/50" aria-hidden />
              <p className="max-w-[18rem] px-4 text-caption text-muted-foreground">{awaitingMessage}</p>
            </div>
          ) : (
            children
          )}
        </div>
        {footer && !isLoading && !isError && <div className="mt-3">{footer}</div>}
      </CardContent>
    </Card>
  );
}
