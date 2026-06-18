import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CHART_COLORS } from '@/components/admin/chartTheme';
import { formatBytes } from '@/lib/userMetrics';

export interface StorageMeterProps {
  totalBytes: number;
  segments: { name: string; bytes: number }[];
}

/**
 * Storage used with a per-category breakdown. No artificial quota — shows the
 * real total and how it splits across document categories.
 */
export function StorageMeter({ totalBytes, segments }: StorageMeterProps) {
  const colored = segments.map((s, i) => ({ ...s, color: CHART_COLORS[i % CHART_COLORS.length] }));

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="p-4 pb-2">
        <h3 className="text-sm font-medium">Storage used</h3>
        <p className="text-2xl font-semibold tabular-nums">{formatBytes(totalBytes)}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 p-4 pt-2">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
          {totalBytes > 0 &&
            colored.map((s) => (
              <div
                key={s.name}
                style={{ width: `${(s.bytes / totalBytes) * 100}%`, backgroundColor: s.color }}
                title={`${s.name}: ${formatBytes(s.bytes)}`}
              />
            ))}
        </div>
        <ul className="space-y-1.5">
          {colored.length === 0 && (
            <li className="text-caption text-muted-foreground">No stored outputs yet.</li>
          )}
          {colored.map((s) => (
            <li key={s.name} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: s.color }} />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{s.name}</span>
              <span className="tabular-nums">{formatBytes(s.bytes)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
