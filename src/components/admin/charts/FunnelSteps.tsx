import { cn } from '@/lib/utils';
import { CHART_COLORS, formatNumber } from '@/components/admin/chartTheme';

export interface FunnelStage {
  label: string;
  value: number;
}

/**
 * Horizontal-bar conversion funnel. Each stage is sized relative to the top of
 * the funnel; connector rows between stages show step conversion and drop-off.
 * Chosen over a trapezoid funnel for precise labelling and dark-mode fidelity.
 */
export function FunnelSteps({ stages }: { stages: FunnelStage[] }) {
  const top = stages[0]?.value ?? 0;

  if (!stages.length || top <= 0) {
    return (
      <div className="flex h-full items-center justify-center text-caption text-muted-foreground">
        No funnel data available.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-center gap-1">
      {stages.map((stage, i) => {
        const widthPct = Math.max((stage.value / top) * 100, 1.5);
        const overallPct = (stage.value / top) * 100;
        const prev = i > 0 ? stages[i - 1] : null;
        const stepConv = prev && prev.value > 0 ? (stage.value / prev.value) * 100 : null;
        const color = CHART_COLORS[i % CHART_COLORS.length];

        return (
          <div key={stage.label}>
            {prev && (
              <div className="flex items-center gap-2 py-1 pl-1 text-caption text-muted-foreground">
                <span className="tabular-nums">
                  {stepConv != null ? `${stepConv.toFixed(1)}% continue` : '—'}
                </span>
                {stepConv != null && stepConv < 100 && (
                  <span className="tabular-nums text-destructive">
                    −{(100 - stepConv).toFixed(1)}% drop-off
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="h-9 flex-1 overflow-hidden rounded-md bg-muted/40">
                <div
                  className={cn(
                    'flex h-full items-center justify-between rounded-md px-3 transition-[width] duration-700',
                  )}
                  style={{ width: `${widthPct}%`, backgroundColor: color }}
                >
                  <span className="truncate text-xs font-medium text-white drop-shadow-sm">
                    {stage.label}
                  </span>
                </div>
              </div>
              <div className="w-28 shrink-0 text-right">
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {formatNumber(stage.value)}
                </span>
                <span className="ml-1.5 text-caption tabular-nums text-muted-foreground">
                  {overallPct.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
