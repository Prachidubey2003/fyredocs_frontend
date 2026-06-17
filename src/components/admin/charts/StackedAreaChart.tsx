import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useId } from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  ANIM,
  AXIS_PROPS,
  CHART_MARGINS,
  GRID_PROPS,
  formatDateTick,
} from '@/components/admin/chartTheme';

export interface AreaSeries {
  key: string;
  label: string;
  color: string;
}

interface StackedAreaChartProps<T extends Record<string, unknown>> {
  data: T[];
  series: AreaSeries[];
  xKey: keyof T & string;
  xTickFormatter?: (value: string) => string;
  valueTickFormatter?: (value: number) => string;
  showLegend?: boolean;
}

/**
 * Stacked area chart for flow/capacity visuals — event pipeline
 * (processed/queued/failed) and infrastructure capacity (used/available).
 */
export function StackedAreaChart<T extends Record<string, unknown>>({
  data,
  series,
  xKey,
  xTickFormatter = formatDateTick,
  valueTickFormatter,
  showLegend = true,
}: StackedAreaChartProps<T>) {
  const gradientPrefix = useId().replace(/:/g, '');
  const config: ChartConfig = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: s.color }]),
  );

  return (
    <ChartContainer config={config} className="aspect-auto h-full w-full">
        <AreaChart data={data} margin={CHART_MARGINS}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`${gradientPrefix}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...GRID_PROPS} vertical={false} />
          <XAxis dataKey={xKey} {...AXIS_PROPS} tickFormatter={xTickFormatter} minTickGap={24} />
          <YAxis {...AXIS_PROPS} width={44} tickFormatter={valueTickFormatter} allowDecimals={false} />
          <ChartTooltip
            content={<ChartTooltipContent labelFormatter={(label) => xTickFormatter(String(label))} />}
          />
          {showLegend && <ChartLegend content={<ChartLegendContent />} />}
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.key}
              stackId="stack"
              stroke={s.color}
              strokeWidth={1.5}
              fill={`url(#${gradientPrefix}-${s.key})`}
              {...ANIM}
            />
          ))}
        </AreaChart>
    </ChartContainer>
  );
}
