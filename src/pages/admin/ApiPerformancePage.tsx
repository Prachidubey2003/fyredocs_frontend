import { useMemo, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { ChartCard } from '@/components/admin/ChartCard';
import { InsightsPanel } from '@/components/admin/InsightsPanel';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ComboChart } from '@/components/admin/charts/ComboChart';
import { StackedBarChart } from '@/components/admin/charts/StackedBarChart';
import { TrendingUp, Gauge, Clock, AlertCircle } from 'lucide-react';
import { useApiPerformance, useApiTrends } from '@/hooks/useAdminMetrics';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { useServerDataTable } from '@/hooks/useDataTable';
import type { ApiPerformanceEndpoint } from '@/lib/adminApi';
import {
  CHART_COLORS,
  SEMANTIC,
  formatCompact,
  formatHourTick,
  formatMs,
  formatNumber,
  shortenPath,
  usageToneClass,
} from '@/components/admin/chartTheme';
import { computeApiInsights } from '@/lib/insights';

const PAGE_SIZE = 10;

function errorRateToneClass(rate: number): string {
  return usageToneClass(rate * 100, 1, 5);
}
function latencyToneClass(ms: number): string {
  return usageToneClass(ms, 100, 500);
}

const endpointColumns: Column<ApiPerformanceEndpoint>[] = [
  { key: 'method', label: 'Method', sortable: true, className: 'font-mono text-xs' },
  { key: 'path', label: 'Path', sortable: true, truncate: 30, className: 'font-mono text-xs' },
  { key: 'requests', label: 'Requests', sortable: true, align: 'right', render: (v) => (v as number).toLocaleString() },
  { key: 'avgLatencyMs', label: 'Avg (ms)', sortable: true, align: 'right', render: (v) => (v as number).toFixed(0) },
  { key: 'p95LatencyMs', label: 'P95 (ms)', sortable: true, align: 'right', render: (v) => (v as number).toFixed(0) },
  { key: 'p99LatencyMs', label: 'P99 (ms)', sortable: true, align: 'right', render: (v) => (v as number).toFixed(0) },
  {
    key: 'errorRate', label: 'Error %', sortable: true, align: 'right',
    render: (_v, row) => <span className={errorRateToneClass(row.errorRate)}>{(row.errorRate * 100).toFixed(1)}%</span>,
  },
];

function EndpointDetailSheet({ endpoint, onClose }: { endpoint: ApiPerformanceEndpoint | null; onClose: () => void }) {
  const rows = endpoint
    ? [
        { label: 'Requests', value: endpoint.requests.toLocaleString() },
        { label: 'Avg Latency', value: `${endpoint.avgLatencyMs.toFixed(0)} ms`, className: latencyToneClass(endpoint.avgLatencyMs) },
        { label: 'P50 Latency', value: `${endpoint.p50LatencyMs.toFixed(0)} ms`, className: latencyToneClass(endpoint.p50LatencyMs) },
        { label: 'P95 Latency', value: `${endpoint.p95LatencyMs.toFixed(0)} ms`, className: latencyToneClass(endpoint.p95LatencyMs) },
        { label: 'P99 Latency', value: `${endpoint.p99LatencyMs.toFixed(0)} ms`, className: latencyToneClass(endpoint.p99LatencyMs) },
        { label: 'Error Rate', value: `${(endpoint.errorRate * 100).toFixed(2)}%`, className: errorRateToneClass(endpoint.errorRate) },
      ]
    : [];

  return (
    <Sheet open={endpoint != null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-md">
        {endpoint && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">{endpoint.method}</Badge>
                Endpoint Details
              </SheetTitle>
              <SheetDescription className="break-all font-mono text-xs">{endpoint.path}</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-3">
              {rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className={`text-sm font-semibold tabular-nums ${row.className ?? ''}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

const ApiPerformancePage = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiPerformanceEndpoint | null>(null);
  const table = useServerDataTable<ApiPerformanceEndpoint>({
    pageSize: PAGE_SIZE,
    defaultSort: { key: 'requests', desc: true },
  });

  const queryParams = useMemo(() => ({
    page: table.page,
    limit: PAGE_SIZE,
    search: table.search || undefined,
    sortBy: table.sortKey ? String(table.sortKey) : undefined,
    sortDir: (table.sortKey ? (table.sortDesc ? 'desc' : 'asc') : undefined) as 'asc' | 'desc' | undefined,
  }), [table.page, table.search, table.sortKey, table.sortDesc]);

  const { data: resp, isLoading, isError, refetch } = useApiPerformance(queryParams);
  const trends = useApiTrends(7);
  const d = resp?.data;
  const meta = resp?.meta;
  const totalRows = Number(meta?.total ?? 0);
  const pageCount = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  const insights = useMemo(() => computeApiInsights(d), [d]);

  // Combo traffic series: error rate as a percentage alongside requests/latency.
  const trafficData = useMemo(
    () => (trends.data?.series ?? []).map((s) => ({ ...s, errorPct: s.errorRate * 100 })),
    [trends.data],
  );

  const topEndpoints = useMemo(
    () => [...(d?.endpoints ?? [])].sort((a, b) => b.requests - a.requests).slice(0, 8),
    [d?.endpoints],
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader title="API" description="Traffic, latency, and error analysis per endpoint" />

      {isError ? (
        <MetricsErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Total Requests" value={d?.summary?.totalRequests?.toLocaleString()} icon={TrendingUp} tone="brand" isLoading={isLoading} />
            <StatCard label="Avg Latency" value={`${(d?.summary?.avgLatencyMs ?? 0).toFixed(0)}ms`} icon={Gauge} tone="info" color={latencyToneClass(d?.summary?.avgLatencyMs ?? 0)} isLoading={isLoading} />
            <StatCard label="P95 Latency" value={`${(d?.summary?.p95LatencyMs ?? 0).toFixed(0)}ms`} icon={Clock} tone="warning" isLoading={isLoading} />
            <StatCard label="P99 Latency" value={`${(d?.summary?.p99LatencyMs ?? 0).toFixed(0)}ms`} icon={Clock} tone="destructive" isLoading={isLoading} />
            <StatCard label="Error Rate" value={`${((d?.summary?.errorRate ?? 0) * 100).toFixed(2)}%`} icon={AlertCircle} tone="destructive" color={errorRateToneClass(d?.summary?.errorRate ?? 0)} isLoading={isLoading} />
          </div>

          <ChartCard
            title="API traffic"
            description={
              trends.data?.sampledSince
                ? `Requests, error rate, and P95 latency`
                : 'Requests, error rate, and P95 latency'
            }
            isLoading={trends.isLoading}
            awaitingData={!trends.data?.series?.length}
            awaitingMessage="Traffic time series is collected by the metrics sampler — data appears once sampling begins."
            exportData={{ filename: 'api-traffic', rows: trafficData }}
            footer={
              trends.data?.sampledSince ? (
                <p className="text-caption text-muted-foreground">
                  Collecting since {new Date(trends.data.sampledSince).toLocaleString()}
                </p>
              ) : undefined
            }
          >
            <ComboChart
              data={trafficData}
              xKey="time"
              xTickFormatter={trends.data?.resolution === 'hour' ? formatHourTick : undefined}
              bars={[{ key: 'requests', label: 'Requests', color: CHART_COLORS[1] }]}
              lines={[
                { key: 'errorPct', label: 'Error %', color: SEMANTIC.danger },
                { key: 'p95Ms', label: 'P95 (ms)', color: SEMANTIC.warning },
              ]}
              leftTickFormatter={formatCompact}
              valueFormatter={(v, key) => (key === 'errorPct' ? `${v.toFixed(2)}%` : key === 'p95Ms' ? formatMs(v) : formatNumber(v))}
            />
          </ChartCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Top endpoints"
              description="Highest traffic endpoints by request count"
              isLoading={isLoading}
              exportData={{ filename: 'top-endpoints', rows: topEndpoints }}
            >
              <StackedBarChart
                data={topEndpoints}
                xKey="path"
                layout="horizontal"
                series={[{ key: 'requests', label: 'Requests', color: CHART_COLORS[0] }]}
                categoryTickFormatter={(p) => shortenPath(p)}
                valueTickFormatter={formatCompact}
                showLegend={false}
              />
            </ChartCard>

            <InsightsPanel insights={insights} title="API insights" isLoading={isLoading} />
          </div>

          <ChartCard
            title="Error analysis"
            description="4xx / 5xx / timeout responses over time"
            isLoading={trends.isLoading}
            awaitingData={!trends.data?.errorClasses?.length}
            awaitingMessage="Error-class breakdown requires the metrics sampler."
            exportData={{ filename: 'api-error-classes', rows: trends.data?.errorClasses ?? [] }}
          >
            <StackedBarChart
              data={trends.data?.errorClasses ?? []}
              xKey="time"
              xTickFormatter={trends.data?.resolution === 'hour' ? formatHourTick : undefined}
              series={[
                { key: 'clientErrors', label: '4xx', color: SEMANTIC.warning },
                { key: 'serverErrors', label: '5xx', color: SEMANTIC.danger },
                { key: 'timeouts', label: 'Timeouts', color: CHART_COLORS[5] },
              ]}
              valueTickFormatter={formatCompact}
            />
          </ChartCard>

          <Card>
            <CardHeader>
              <CardTitle>All endpoints</CardTitle>
              <CardDescription>Sorted by request count — click a row for the full breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable<ApiPerformanceEndpoint>
                serverSide
                data={d?.endpoints ?? []}
                columns={endpointColumns}
                isLoading={isLoading}
                emptyMessage="No endpoint data available"
                search={table.search}
                onSearchChange={table.setSearch}
                sortKey={table.sortKey}
                sortDesc={table.sortDesc}
                onSortChange={table.toggleSort}
                page={table.page}
                onPageChange={table.setPage}
                pageCount={pageCount}
                totalRows={totalRows}
                onRowClick={setSelectedEndpoint}
              />
            </CardContent>
          </Card>

          <EndpointDetailSheet endpoint={selectedEndpoint} onClose={() => setSelectedEndpoint(null)} />
        </>
      )}
    </div>
  );
};

export default ApiPerformancePage;
