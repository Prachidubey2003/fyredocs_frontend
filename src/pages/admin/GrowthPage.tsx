import { useMemo } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { ChartCard } from '@/components/admin/ChartCard';
import { InsightsPanel } from '@/components/admin/InsightsPanel';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MultiLineChart, type LineSeries } from '@/components/admin/charts/MultiLineChart';
import { StackedBarChart } from '@/components/admin/charts/StackedBarChart';
import { Users, Repeat } from 'lucide-react';
import { useGrowth, useAcquisition } from '@/hooks/useAdminMetrics';
import { useAdminTimeRange } from '@/hooks/useAdminTimeRange';
import {
  CHART_COLORS,
  SEMANTIC,
  formatCompact,
  formatNumber,
} from '@/components/admin/chartTheme';
import { computeDelta, seriesFrom } from '@/lib/adminTrends';
import { computeGrowthInsights } from '@/lib/insights';

const CHANNEL_SERIES = [
  { key: 'organic', label: 'Organic', color: CHART_COLORS[2] },
  { key: 'referral', label: 'Referral', color: CHART_COLORS[1] },
  { key: 'paid', label: 'Paid', color: CHART_COLORS[0] },
  { key: 'campaign', label: 'Campaign', color: CHART_COLORS[4] },
  { key: 'direct', label: 'Direct', color: CHART_COLORS[3] },
  { key: 'unknown', label: 'Unknown', color: 'hsl(var(--muted-foreground))' },
];

function retentionChipClass(value: number): string {
  if (value > 50) return 'bg-success-subtle text-success-subtle-foreground';
  if (value > 20) return 'bg-warning-subtle text-warning-subtle-foreground';
  return 'bg-destructive-subtle text-destructive-subtle-foreground';
}

function RetentionChip({ value }: { value: number }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${retentionChipClass(value)}`}>
      {value.toFixed(1)}%
    </span>
  );
}

const GrowthPage = () => {
  const { days } = useAdminTimeRange();
  const { data, isLoading, isError, refetch } = useGrowth(days);
  const acquisition = useAcquisition(days);
  const d = data;

  const dauTrend = computeDelta(seriesFrom(d?.dauTrend, (row) => row.dau));
  const insights = useMemo(() => computeGrowthInsights(d), [d]);

  // Active-users line chart: prefer DAU/WAU/MAU, else DAU + previous-period overlay.
  const { activeData, activeSeries } = useMemo(() => {
    if (d?.activeTrend?.length) {
      return {
        activeData: d.activeTrend as Record<string, unknown>[],
        activeSeries: [
          { key: 'dau', label: 'DAU', color: CHART_COLORS[1] },
          { key: 'wau', label: 'WAU', color: CHART_COLORS[2] },
          { key: 'mau', label: 'MAU', color: CHART_COLORS[4] },
        ] as LineSeries[],
      };
    }
    const byDate = new Map<string, Record<string, number | string>>();
    for (const r of d?.dauTrend ?? []) byDate.set(r.date, { date: r.date, dau: r.dau });
    for (const r of d?.previousDauTrend ?? []) {
      const row = byDate.get(r.date) ?? { date: r.date };
      row.prevDau = r.dau;
      byDate.set(r.date, row);
    }
    const series: LineSeries[] = [{ key: 'dau', label: 'DAU', color: CHART_COLORS[1] }];
    if (d?.previousDauTrend?.length) series.push({ key: 'prevDau', label: 'Previous period', color: 'hsl(var(--muted-foreground))', dashed: true });
    return {
      activeData: [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date))),
      activeSeries: series,
    };
  }, [d?.activeTrend, d?.dauTrend, d?.previousDauTrend]);

  // Stickiness trend from DAU/MAU per day (requires activeTrend).
  const stickinessData = useMemo(
    () => (d?.activeTrend ?? []).map((r) => ({ date: r.date, stickiness: r.mau > 0 ? (r.dau / r.mau) * 100 : 0 })),
    [d?.activeTrend],
  );

  // Acquisition channels (long → wide by date).
  const channelData = useMemo(() => {
    const rows = acquisition.data?.daily ?? [];
    if (!rows.length) return [];
    const byDate = new Map<string, Record<string, number | string>>();
    for (const r of rows) {
      const row = byDate.get(r.date) ?? { date: r.date };
      row[r.channel] = ((row[r.channel] as number) ?? 0) + r.signups;
      byDate.set(r.date, row);
    }
    const out = [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    for (const row of out) for (const s of CHANNEL_SERIES) if (row[s.key] == null) row[s.key] = 0;
    return out;
  }, [acquisition.data]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader title="Growth" description="Active users, stickiness, acquisition, and retention" />

      {isError ? (
        <MetricsErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard label="DAU" value={d?.dau} icon={Users} tone="brand" isLoading={isLoading} trend={dauTrend ?? undefined} />
            <StatCard label="WAU" value={d?.wau} icon={Users} tone="info" isLoading={isLoading} />
            <StatCard label="MAU" value={d?.mau} icon={Users} tone="info" isLoading={isLoading} />
            <StatCard label="Stickiness" value={d?.stickiness != null ? `${(d.stickiness * 100).toFixed(1)}%` : null} icon={Repeat} tone="success" subtitle="DAU / MAU" isLoading={isLoading} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Active users"
              description={`DAU / WAU / MAU — last ${days} days`}
              isLoading={isLoading}
              exportData={{ filename: 'active-users', rows: activeData }}
            >
              <MultiLineChart data={activeData} xKey="date" series={activeSeries} leftTickFormatter={formatCompact} valueFormatter={(v) => formatNumber(v)} />
            </ChartCard>

            <ChartCard
              title="Stickiness"
              description="DAU / MAU ratio over time"
              isLoading={isLoading}
              awaitingData={stickinessData.length === 0}
              awaitingMessage="Stickiness trend requires the DAU/WAU/MAU series from the updated growth endpoint."
              exportData={{ filename: 'stickiness', rows: stickinessData }}
            >
              <MultiLineChart
                data={stickinessData}
                xKey="date"
                series={[{ key: 'stickiness', label: 'Stickiness', color: SEMANTIC.success }]}
                leftTickFormatter={(v) => `${v.toFixed(0)}%`}
                valueFormatter={(v) => `${v.toFixed(1)}%`}
              />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="User acquisition"
              description="Daily signups by channel"
              isLoading={acquisition.isLoading}
              awaitingData={channelData.length === 0}
              awaitingMessage="Acquisition channels require referrer/UTM capture on signup."
              exportData={{ filename: 'acquisition-channels', rows: channelData }}
            >
              <StackedBarChart data={channelData} xKey="date" series={CHANNEL_SERIES} valueTickFormatter={formatNumber} />
            </ChartCard>

            <InsightsPanel insights={insights} title="Growth insights" isLoading={isLoading} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Retention cohorts</CardTitle>
              <CardDescription>User retention by signup cohort</CardDescription>
            </CardHeader>
            <CardContent>
              {d?.retention?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cohort Date</TableHead>
                      <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Size</TableHead>
                      <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">D1 (%)</TableHead>
                      <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">D7 (%)</TableHead>
                      <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">D30 (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.retention.map((cohort) => (
                      <TableRow key={cohort.cohortDate} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{cohort.cohortDate}</TableCell>
                        <TableCell className="text-right">{cohort.cohortSize}</TableCell>
                        <TableCell className="text-right"><RetentionChip value={cohort.d1} /></TableCell>
                        <TableCell className="text-right"><RetentionChip value={cohort.d7} /></TableCell>
                        <TableCell className="text-right"><RetentionChip value={cohort.d30} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-8 text-center text-muted-foreground">{isLoading ? 'Loading…' : 'No retention data available'}</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default GrowthPage;
