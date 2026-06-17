import { useMemo } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { ChartCard } from '@/components/admin/ChartCard';
import { InsightsPanel } from '@/components/admin/InsightsPanel';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MultiLineChart } from '@/components/admin/charts/MultiLineChart';
import { StackedBarChart } from '@/components/admin/charts/StackedBarChart';
import { CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';
import { useReliability } from '@/hooks/useAdminMetrics';
import { useAdminTimeRange } from '@/hooks/useAdminTimeRange';
import {
  CHART_COLORS,
  SEMANTIC,
  formatNumber,
  formatPercent,
  formatSeconds,
  rateToneClass,
} from '@/components/admin/chartTheme';
import { computeDelta, seriesFrom } from '@/lib/adminTrends';
import { reliabilityRateTrend } from '@/lib/adminDerived';
import { computeReliabilityInsights } from '@/lib/insights';

const FAILURE_SERIES = [
  { key: 'timeout', label: 'Timeout', color: SEMANTIC.warning },
  { key: 'validation', label: 'Validation', color: CHART_COLORS[3] },
  { key: 'processing', label: 'Processing', color: CHART_COLORS[4] },
  { key: 'infrastructure', label: 'Infrastructure', color: SEMANTIC.danger },
  { key: 'other', label: 'Other', color: CHART_COLORS[5] },
];

const ReliabilityPage = () => {
  const { days } = useAdminTimeRange();
  const { data, isLoading, isError, refetch } = useReliability(days);
  const d = data;
  const rate = (d?.jobRate?.successRate ?? 0) * 100;

  const completedTrend = computeDelta(seriesFrom(d?.errorTrend, (row) => row.total - row.failures));
  const failedTrend = computeDelta(seriesFrom(d?.errorTrend, (row) => row.failures));

  const rateTrend = useMemo(() => reliabilityRateTrend(d), [d]);
  const insights = useMemo(() => computeReliabilityInsights(d), [d]);

  // Pivot failure categories (long → wide by date).
  const failureData = useMemo(() => {
    if (!d?.failureCategories?.length) return [];
    const byDate = new Map<string, Record<string, number | string>>();
    for (const r of d.failureCategories) {
      const row = byDate.get(r.date) ?? { date: r.date };
      row[r.category] = ((row[r.category] as number) ?? 0) + r.count;
      byDate.set(r.date, row);
    }
    const rows = [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    for (const row of rows) for (const s of FAILURE_SERIES) if (row[s.key] == null) row[s.key] = 0;
    return rows;
  }, [d]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Reliability"
        description="Job success rates, latency, and failure analysis"
      />

      {isError ? (
        <MetricsErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Success Rate" value={`${rate.toFixed(1)}%`} icon={ShieldCheck} tone="success" color={rateToneClass(rate)} isLoading={isLoading} />
            <StatCard label="Completed" value={d?.jobRate?.completed} icon={CheckCircle2} tone="success" color="text-success" isLoading={isLoading} trend={completedTrend ?? undefined} />
            <StatCard label="Failed" value={d?.jobRate?.failed} icon={XCircle} tone="destructive" color="text-destructive" isLoading={isLoading} trend={failedTrend ? { ...failedTrend, invertGood: true } : undefined} />
            <StatCard label="P50 Latency" value={formatSeconds(d?.processingTime?.p50Seconds, 2)} icon={Clock} tone="info" isLoading={isLoading} />
            <StatCard label="P95 Latency" value={formatSeconds(d?.processingTime?.p95Seconds, 2)} icon={Clock} tone="warning" isLoading={isLoading} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="Success & failure rate"
              description={`Daily completion quality — last ${days} days`}
              isLoading={isLoading}
              exportData={{ filename: 'reliability-rate-trend', rows: rateTrend }}
            >
              <MultiLineChart
                data={rateTrend}
                xKey="date"
                series={[
                  { key: 'successRate', label: 'Success rate', color: SEMANTIC.success },
                  { key: 'failureRate', label: 'Failure rate', color: SEMANTIC.danger },
                ]}
                leftTickFormatter={(v) => `${v.toFixed(0)}%`}
                valueFormatter={(v) => formatPercent(v, 1, true)}
              />
            </ChartCard>

            <ChartCard
              title="Processing latency"
              description="P50 / P95 / P99 job duration"
              isLoading={isLoading}
              awaitingData={!d?.processingTimeTrend?.length}
              awaitingMessage="Latency percentile trend requires the updated reliability endpoint."
              exportData={{ filename: 'reliability-latency-trend', rows: d?.processingTimeTrend ?? [] }}
            >
              <MultiLineChart
                data={d?.processingTimeTrend ?? []}
                xKey="date"
                series={[
                  { key: 'p50', label: 'P50', color: CHART_COLORS[1] },
                  { key: 'p95', label: 'P95', color: SEMANTIC.warning },
                  { key: 'p99', label: 'P99', color: SEMANTIC.danger },
                ]}
                leftTickFormatter={(v) => `${v.toFixed(1)}s`}
                valueFormatter={(v) => formatSeconds(v, 2)}
              />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Failure analysis"
              description="Daily failures by root-cause category"
              isLoading={isLoading}
              awaitingData={!d?.failureCategories?.length}
              awaitingMessage="Failure-category breakdown requires the updated reliability endpoint."
              exportData={{ filename: 'failure-categories', rows: failureData }}
            >
              <StackedBarChart data={failureData} xKey="date" series={FAILURE_SERIES} valueTickFormatter={formatNumber} />
            </ChartCard>

            <InsightsPanel insights={insights} title="Reliability insights" isLoading={isLoading} />
          </div>

          {(d?.planLimitHits?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Plan limit hits</CardTitle>
                <CardDescription>Users hitting plan limits over time</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Date</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Plan</TableHead>
                      <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Hits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d?.planLimitHits?.map((row, i) => (
                      <TableRow key={i} className="transition-colors hover:bg-muted/50">
                        <TableCell>{row.date}</TableCell>
                        <TableCell className="capitalize">{row.planName}</TableCell>
                        <TableCell className="text-right font-medium text-warning">{row.hits}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ReliabilityPage;
