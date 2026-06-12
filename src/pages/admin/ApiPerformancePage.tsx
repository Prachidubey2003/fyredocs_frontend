import { useMemo, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { TrendingUp, Gauge, Clock, AlertCircle } from 'lucide-react';
import { useApiPerformance } from '@/hooks/useAdminMetrics';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { useServerDataTable } from '@/hooks/useDataTable';
import type { ApiPerformanceEndpoint } from '@/lib/adminApi';
import {
  AXIS_PROPS,
  GRID_PROPS,
  SEMANTIC,
  shortenPath,
  usageToneClass,
} from '@/components/admin/chartTheme';

const latencyConfig = {
  p95LatencyMs: { label: 'P95 Latency (ms)', color: SEMANTIC.warning },
} satisfies ChartConfig;

const errorConfig = {
  errorRate: { label: 'Error Rate', color: SEMANTIC.danger },
} satisfies ChartConfig;

const PAGE_SIZE = 10;

/** Token class for an error-rate fraction (lower is better). */
function errorRateToneClass(rate: number): string {
  return usageToneClass(rate * 100, 1, 5);
}

/** Token class for a latency value in ms (lower is better). */
function latencyToneClass(ms: number): string {
  return usageToneClass(ms, 100, 500);
}

const endpointColumns: Column<ApiPerformanceEndpoint>[] = [
  { key: 'method', label: 'Method', sortable: true, className: 'font-mono text-xs' },
  { key: 'path', label: 'Path', sortable: true, truncate: 30, className: 'font-mono text-xs' },
  { key: 'requests', label: 'Requests', sortable: true, align: 'right', render: (v) => (v as number).toLocaleString() },
  { key: 'avgLatencyMs', label: 'Avg (ms)', sortable: true, align: 'right', render: (v) => (v as number).toFixed(0) },
  { key: 'p50LatencyMs', label: 'P50 (ms)', sortable: true, align: 'right', render: (v) => (v as number).toFixed(0) },
  { key: 'p95LatencyMs', label: 'P95 (ms)', sortable: true, align: 'right', render: (v) => (v as number).toFixed(0) },
  { key: 'p99LatencyMs', label: 'P99 (ms)', sortable: true, align: 'right', render: (v) => (v as number).toFixed(0) },
  {
    key: 'errorRate', label: 'Error %', sortable: true, align: 'right',
    render: (_v, row) => (
      <span className={errorRateToneClass(row.errorRate)}>
        {(row.errorRate * 100).toFixed(1)}%
      </span>
    ),
  },
];

/** Detail rows for the endpoint breakdown sheet (built from the table row). */
function EndpointDetailSheet({
  endpoint,
  onClose,
}: {
  endpoint: ApiPerformanceEndpoint | null;
  onClose: () => void;
}) {
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
              <SheetDescription className="break-all font-mono text-xs">
                {endpoint.path}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-3">
              {rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className={`text-sm font-semibold tabular-nums ${row.className ?? ''}`}>
                    {row.value}
                  </span>
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
  const d = resp?.data;
  const meta = resp?.meta;
  const totalRows = Number(meta?.total ?? 0);
  const pageCount = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="API Performance"
        description="Request latency, throughput, and error rates per endpoint"
      />

      {isError ? (
        <MetricsErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard
              label="Total Requests"
              value={d?.summary?.totalRequests?.toLocaleString()}
              icon={TrendingUp}
              tone="brand"
              isLoading={isLoading}
            />
            <StatCard
              label="Avg Latency"
              value={`${(d?.summary?.avgLatencyMs ?? 0).toFixed(0)}ms`}
              icon={Gauge}
              tone="info"
              color={latencyToneClass(d?.summary?.avgLatencyMs ?? 0)}
              isLoading={isLoading}
            />
            <StatCard
              label="P95 Latency"
              value={`${(d?.summary?.p95LatencyMs ?? 0).toFixed(0)}ms`}
              icon={Clock}
              tone="warning"
              isLoading={isLoading}
            />
            <StatCard
              label="P99 Latency"
              value={`${(d?.summary?.p99LatencyMs ?? 0).toFixed(0)}ms`}
              icon={Clock}
              tone="destructive"
              isLoading={isLoading}
            />
            <StatCard
              label="Error Rate"
              value={`${((d?.summary?.errorRate ?? 0) * 100).toFixed(2)}%`}
              icon={AlertCircle}
              tone="destructive"
              color={errorRateToneClass(d?.summary?.errorRate ?? 0)}
              isLoading={isLoading}
            />
          </div>

          {/* Slowest Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle>Slowest Endpoints</CardTitle>
              <CardDescription>Top 5 by P95 latency</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                <ChartContainer config={latencyConfig} className="h-[300px] w-full">
                  <BarChart data={d?.slowestEndpoints ?? []} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid {...GRID_PROPS} horizontal={false} />
                    <XAxis type="number" {...AXIS_PROPS} />
                    <YAxis
                      type="category"
                      dataKey="path"
                      {...AXIS_PROPS}
                      fontSize={11}
                      width={96}
                      tickFormatter={(p: string) => shortenPath(p)}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="p95LatencyMs" fill="var(--color-p95LatencyMs)" radius={[0, 4, 4, 0]}
                      isAnimationActive animationDuration={800} animationEasing="ease-out" />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Highest Error Rate Endpoints */}
          {(d?.highestErrorEndpoints?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Highest Error Rate Endpoints</CardTitle>
                <CardDescription>Top 5 by error rate (min 10 requests)</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={errorConfig} className="h-[300px] w-full">
                  <BarChart
                    data={(d?.highestErrorEndpoints ?? []).map(e => ({ ...e, errorRate: e.errorRate * 100 }))}
                    layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid {...GRID_PROPS} horizontal={false} />
                    <XAxis type="number" {...AXIS_PROPS} unit="%" />
                    <YAxis
                      type="category"
                      dataKey="path"
                      {...AXIS_PROPS}
                      fontSize={11}
                      width={96}
                      tickFormatter={(p: string) => shortenPath(p)}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="errorRate" fill="var(--color-errorRate)" radius={[0, 4, 4, 0]}
                      isAnimationActive animationDuration={800} animationEasing="ease-out" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* All Endpoints Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Endpoints</CardTitle>
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
