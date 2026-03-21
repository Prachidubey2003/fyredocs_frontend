import { Layout } from '@/components/layout/Layout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApiPerformance } from '@/hooks/useAdminMetrics';

const latencyConfig = {
  p95LatencyMs: { label: 'P95 Latency (ms)', color: 'hsl(24, 95%, 53%)' },
} satisfies ChartConfig;

const errorConfig = {
  errorRate: { label: 'Error Rate', color: 'hsl(0, 84%, 60%)' },
} satisfies ChartConfig;

const ApiPerformancePage = () => {
  const { data, isLoading } = useApiPerformance();
  const d = data?.data;

  return (
    <Layout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <AdminPageHeader title="API Performance" description="Request latency, throughput, and error rates per endpoint" />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Total Requests" value={d?.summary?.totalRequests?.toLocaleString()} isLoading={isLoading} />
          <StatCard label="Avg Latency" value={`${(d?.summary?.avgLatencyMs ?? 0).toFixed(0)}ms`} isLoading={isLoading} />
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
                  <Bar dataKey="p95LatencyMs" fill="var(--color-p95LatencyMs)" radius={[0, 4, 4, 0]} />
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
                  <Bar dataKey="errorRate" fill="var(--color-errorRate)" radius={[0, 4, 4, 0]} />
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
            {isLoading ? <Skeleton className="h-[300px] w-full" /> : (d?.endpoints?.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No endpoint data available</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead className="text-right">Requests</TableHead>
                      <TableHead className="text-right">Avg (ms)</TableHead>
                      <TableHead className="text-right">P50 (ms)</TableHead>
                      <TableHead className="text-right">P95 (ms)</TableHead>
                      <TableHead className="text-right">P99 (ms)</TableHead>
                      <TableHead className="text-right">Error %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d?.endpoints?.map((ep, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{ep.method}</TableCell>
                        <TableCell className="font-mono text-xs">{ep.path}</TableCell>
                        <TableCell className="text-right">{ep.requests.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{ep.avgLatencyMs.toFixed(0)}</TableCell>
                        <TableCell className="text-right">{ep.p50LatencyMs.toFixed(0)}</TableCell>
                        <TableCell className="text-right">{ep.p95LatencyMs.toFixed(0)}</TableCell>
                        <TableCell className="text-right">{ep.p99LatencyMs.toFixed(0)}</TableCell>
                        <TableCell className="text-right">
                          <span className={ep.errorRate > 0.05 ? 'text-red-600' : ep.errorRate > 0.01 ? 'text-yellow-600' : 'text-green-600'}>
                            {(ep.errorRate * 100).toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ApiPerformancePage;
