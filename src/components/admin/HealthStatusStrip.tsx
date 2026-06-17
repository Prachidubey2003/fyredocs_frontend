import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { STATUS_BG, type HealthStatus } from '@/components/admin/chartTheme';

export interface HealthSegment {
  label: string;
  status: HealthStatus;
  detail?: string;
}

const STATUS_LABEL: Record<HealthStatus, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
};

/**
 * Compact strip of named subsystems/services colored by status, with a count
 * summary. Used on the overview, System Health, and Server pages.
 */
export function HealthStatusStrip({ segments }: { segments: HealthSegment[] }) {
  const counts = segments.reduce(
    (acc, s) => {
      acc[s.status] += 1;
      return acc;
    },
    { healthy: 0, warning: 0, critical: 0 } as Record<HealthStatus, number>,
  );

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', STATUS_BG.healthy)} /> {counts.healthy} healthy
          </span>
          <span className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', STATUS_BG.warning)} /> {counts.warning} warning
          </span>
          <span className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', STATUS_BG.critical)} /> {counts.critical} critical
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {segments.map((seg) => (
            <Tooltip key={seg.label}>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-caption',
                    seg.status === 'healthy'
                      ? 'border-success/30 bg-success-subtle text-success-subtle-foreground'
                      : seg.status === 'warning'
                        ? 'border-warning/30 bg-warning-subtle text-warning-subtle-foreground'
                        : 'border-destructive/30 bg-destructive-subtle text-destructive-subtle-foreground',
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_BG[seg.status])} />
                  {seg.label}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-xs">
                  {seg.label}: {STATUS_LABEL[seg.status]}
                  {seg.detail ? ` — ${seg.detail}` : ''}
                </span>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
