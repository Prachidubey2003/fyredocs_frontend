import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  ANIM,
  AXIS_PROPS,
  CHART_MARGINS,
  GRID_PROPS,
  formatDateTick,
} from '@/components/admin/chartTheme';

export interface LineSeries {
  key: string;
  label: string;
  color: string;
  /** Dashed line — used for previous-period overlays. */
  dashed?: boolean;
  /** Plot against the right axis (e.g. latency alongside counts). */
  rightAxis?: boolean;
}

interface MultiLineChartProps<T extends Record<string, unknown>> {
  data: T[];
  series: LineSeries[];
  xKey: keyof T & string;
  /** Format x-axis ticks. Defaults to month/day date formatting. */
  xTickFormatter?: (value: string) => string;
  leftTickFormatter?: (value: number) => string;
  rightTickFormatter?: (value: number) => string;
  valueFormatter?: (value: number, key: string) => string;
}

/**
 * Multi-series line chart with optional dashed overlays and a secondary
 * right-hand axis. Used for DAU/WAU/MAU, latency percentiles, and rate trends.
 */
export function MultiLineChart<T extends Record<string, unknown>>({
  data,
  series,
  xKey,
  xTickFormatter = formatDateTick,
  leftTickFormatter,
  rightTickFormatter,
  valueFormatter,
}: MultiLineChartProps<T>) {
  const config: ChartConfig = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: s.color }]),
  );
  const hasRightAxis = series.some((s) => s.rightAxis);

  return (
    <ChartContainer config={config} className="aspect-auto h-full w-full">
        <LineChart data={data} margin={CHART_MARGINS}>
          <CartesianGrid {...GRID_PROPS} vertical={false} />
          <XAxis dataKey={xKey} {...AXIS_PROPS} tickFormatter={xTickFormatter} minTickGap={24} />
          <YAxis
            {...AXIS_PROPS}
            yAxisId="left"
            width={44}
            tickFormatter={leftTickFormatter}
            allowDecimals={false}
          />
          {hasRightAxis && (
            <YAxis
              {...AXIS_PROPS}
              yAxisId="right"
              orientation="right"
              width={44}
              tickFormatter={rightTickFormatter}
            />
          )}
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(label) => xTickFormatter(String(label))}
                formatter={
                  valueFormatter
                    ? (value, name) => (
                        <span className="flex w-full justify-between gap-3">
                          <span className="text-muted-foreground">
                            {config[name as string]?.label ?? name}
                          </span>
                          <span className="font-mono font-medium tabular-nums">
                            {valueFormatter(Number(value), String(name))}
                          </span>
                        </span>
                      )
                    : undefined
                }
              />
            }
          />
          {series.map((s) => (
            <Line
              key={s.key}
              yAxisId={s.rightAxis ? 'right' : 'left'}
              type="monotone"
              dataKey={s.key}
              name={s.key}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dashed ? '4 4' : undefined}
              dot={false}
              activeDot={{ r: 3 }}
              connectNulls
              {...ANIM}
            />
          ))}
        </LineChart>
    </ChartContainer>
  );
}
