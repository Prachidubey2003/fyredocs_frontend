import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import { useId } from 'react';

export interface SparklinePoint {
  value: number;
}

/**
 * Axis-less mini area chart for KPI cards. No grid, tooltip, or labels —
 * purely the shape of the recent trend. Color defaults to the current text
 * color so it inherits tone from the parent.
 */
export function Sparkline({
  data,
  color = 'currentColor',
  height = 36,
  className,
}: {
  data: SparklinePoint[];
  color?: string;
  height?: number;
  className?: string;
}) {
  const gradientId = useId().replace(/:/g, '');

  if (!data || data.length < 2) {
    return <div style={{ height }} className={className} aria-hidden />;
  }

  return (
    <div style={{ height }} className={className} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
