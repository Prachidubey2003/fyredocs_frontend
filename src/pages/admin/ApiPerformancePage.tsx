import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useApiPerformance } from '@/hooks/useAdminMetrics';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { useServerDataTable } from '@/hooks/useDataTable';
import type { ApiPerformanceEndpoint } from '@/lib/adminApi';

const latencyConfig = {
  p95LatencyMs: { label: 'P95 Latency (ms)', color: 'hsl(24, 95%, 53%)' },
} satisfies ChartConfig;

const errorConfig = {
  errorRate: { label: 'Error Rate', color: 'hsl(0, 84%, 60%)' },
} satisfies ChartConfig;

const PAGE_SIZE = 10;

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
      <span className={row.errorRate > 0.05 ? 'text-red-600' : row.errorRate > 0.01 ? 'text-yellow-600' : 'text-green-600'}>
        {(row.errorRate * 100).toFixed(1)}%
      </span>
    ),
  },
];

const ApiPerformancePage = () => {
  const queryClient = useQueryClient();
  const handleRefresh = useCallback(() => queryClient.resetQueries({ queryKey: ['admin', 'apiPerformance'] }), [queryClient]);
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

  const { data: resp, isLoading } = useApiPerformance(queryParams);
  const d = resp?.data;
  const meta = resp?.meta;
  const totalRows = Number(meta?.total ?? 0);
  const pageCount = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <AdminPageHeader title="API Performance" description="Request latency, throughput, and error rates per endpoint" onRefresh={handleRefresh} />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Total Requests" value={d?.summary?.totalRequests?.toLocaleString()} isLoading={isLoading} />
          <StatCard label="Avg Latency" value={`${(d?.summary?.avgLatencyMs ?? 0).toFixed(0)}ms`}
            color={(d?.summary?.avgLatencyMs ?? 0) > 500 ? 'text-red-600' : (d?.summary?.avgLatencyMs ?? 0) > 100 ? 'text-yellow-600' : 'text-green-600'}
            isLoading={isLoading} />
          <StatCard label="P95 Latency" value={`${(d?.summary?.p95LatencyMs ?? 0).toFixed(0)}ms`} color="text-orange-600" isLoading={isLoading} />
          <StatCard label="P99 Latency" value={`${(d?.summary?.p99LatencyMs ?? 0).toFixed(0)}ms`} color="text-red-600" isLoading={isLoading} />
          <StatCard label="Error Rate" value={`${((d?.summary?.errorRate ?? 0) * 100).toFixed(2)}%`}
            color={(d?.summary?.errorRate ?? 0) > 0.05 ? 'text-red-600' : 'text-green-600'} isLoading={isLoading} />
        </div>

        {/* Slowest Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle>Slowest Endpoints</CardTitle>
            <CardDescription>Top 5 by P95 latency</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[250px] w-full" /> : (
              <ChartContainer config={latencyConfig} className="h-[250px] w-full">
                <BarChart data={d?.slowestEndpoints ?? []} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis type="category" dataKey="path" tickLine={false} axisLine={false} fontSize={11} width={120} />
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
              <ChartContainer config={errorConfig} className="h-[250px] w-full">
                <BarChart
                  data={(d?.highestErrorEndpoints ?? []).map(e => ({ ...e, errorRate: e.errorRate * 100 }))}
                  layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} unit="%" />
                  <YAxis type="category" dataKey="path" tickLine={false} axisLine={false} fontSize={11} width={120} />
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
            <CardDescription>Sorted by request count</CardDescription>
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
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ApiPerformancePage;
