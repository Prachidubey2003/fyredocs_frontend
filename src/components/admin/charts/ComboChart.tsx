import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';
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

export interface ComboBarSeries {
  key: string;
  label: string;
  color: string;
}

export interface ComboLineSeries extends ComboBarSeries {
  /** Plot against the right axis. Defaults to true for lines in a combo. */
  rightAxis?: boolean;
}

interface ComboChartProps<T extends Record<string, unknown>> {
  data: T[];
  bars: ComboBarSeries[];
  lines: ComboLineSeries[];
  xKey: keyof T & string;
  xTickFormatter?: (value: string) => string;
  leftTickFormatter?: (value: number) => string;
  rightTickFormatter?: (value: number) => string;
  valueFormatter?: (value: number, key: string) => string;
}

/**
 * Bars + lines on dual axes. Used for Revenue & Growth (revenue bars, signup
 * line) and API Traffic (request bars, error-rate/latency lines).
 */
export function ComboChart<T extends Record<string, unknown>>({
  data,
  bars,
  lines,
  xKey,
  xTickFormatter = formatDateTick,
  leftTickFormatter,
  rightTickFormatter,
  valueFormatter,
}: ComboChartProps<T>) {
  const config: ChartConfig = Object.fromEntries(
    [...bars, ...lines].map((s) => [s.key, { label: s.label, color: s.color }]),
  );

  return (
    <ChartContainer config={config} className="aspect-auto h-full w-full">
        <ComposedChart data={data} margin={CHART_MARGINS}>
          <CartesianGrid {...GRID_PROPS} vertical={false} />
          <XAxis dataKey={xKey} {...AXIS_PROPS} tickFormatter={xTickFormatter} minTickGap={24} />
          <YAxis {...AXIS_PROPS} yAxisId="left" width={44} tickFormatter={leftTickFormatter} />
          <YAxis
            {...AXIS_PROPS}
            yAxisId="right"
            orientation="right"
            width={44}
            tickFormatter={rightTickFormatter}
          />
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
          {bars.map((b) => (
            <Bar
              key={b.key}
              yAxisId="left"
              dataKey={b.key}
              name={b.key}
              fill={b.color}
              radius={[3, 3, 0, 0]}
              maxBarSize={40}
              {...ANIM}
            />
          ))}
          {lines.map((l) => (
            <Line
              key={l.key}
              yAxisId={l.rightAxis === false ? 'left' : 'right'}
              type="monotone"
              dataKey={l.key}
              name={l.key}
              stroke={l.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
              connectNulls
              {...ANIM}
            />
          ))}
        </ComposedChart>
    </ChartContainer>
  );
}
