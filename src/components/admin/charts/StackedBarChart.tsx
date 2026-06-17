import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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

export interface StackSeries {
  key: string;
  label: string;
  color: string;
}

interface StackedBarChartProps<T extends Record<string, unknown>> {
  data: T[];
  series: StackSeries[];
  xKey: keyof T & string;
  layout?: 'vertical' | 'horizontal';
  xTickFormatter?: (value: string) => string;
  /** Tick formatter for the category axis when horizontal. */
  categoryTickFormatter?: (value: string) => string;
  valueTickFormatter?: (value: number) => string;
  showLegend?: boolean;
}

/**
 * Stacked bars. Default (vertical layout) stacks categories over a time x-axis
 * — acquisition channels, failure categories, API error classes. Horizontal
 * layout puts categories on the y-axis for ranked breakdowns.
 */
export function StackedBarChart<T extends Record<string, unknown>>({
  data,
  series,
  xKey,
  layout = 'vertical',
  xTickFormatter = formatDateTick,
  categoryTickFormatter,
  valueTickFormatter,
  showLegend = true,
}: StackedBarChartProps<T>) {
  const config: ChartConfig = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: s.color }]),
  );
  const isHorizontal = layout === 'horizontal';

  return (
    <ChartContainer config={config} className="aspect-auto h-full w-full">
        <BarChart
          data={data}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          margin={CHART_MARGINS}
        >
          <CartesianGrid {...GRID_PROPS} horizontal={!isHorizontal} vertical={isHorizontal} />
          {isHorizontal ? (
            <>
              <XAxis type="number" {...AXIS_PROPS} tickFormatter={valueTickFormatter} />
              <YAxis
                type="category"
                dataKey={xKey}
                {...AXIS_PROPS}
                width={120}
                tickFormatter={categoryTickFormatter}
              />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} {...AXIS_PROPS} tickFormatter={xTickFormatter} minTickGap={24} />
              <YAxis {...AXIS_PROPS} width={40} tickFormatter={valueTickFormatter} allowDecimals={false} />
            </>
          )}
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(label) =>
                  isHorizontal ? String(label) : xTickFormatter(String(label))
                }
              />
            }
          />
          {showLegend && <ChartLegend content={<ChartLegendContent />} />}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.key}
              stackId="stack"
              fill={s.color}
              radius={i === series.length - 1 ? (isHorizontal ? [0, 3, 3, 0] : [3, 3, 0, 0]) : 0}
              maxBarSize={isHorizontal ? 28 : 44}
              {...ANIM}
            />
          ))}
        </BarChart>
    </ChartContainer>
  );
}
