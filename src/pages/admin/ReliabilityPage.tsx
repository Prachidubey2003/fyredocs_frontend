import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';
import { useReliability } from '@/hooks/useAdminMetrics';
import { useAdminTimeRange } from '@/hooks/useAdminTimeRange';
import {
  AXIS_PROPS,
  CHART_COLORS,
  GRID_PROPS,
  SEMANTIC,
  rateToneClass,
} from '@/components/admin/chartTheme';
import { computeDelta, seriesFrom } from '@/lib/adminTrends';

const errorTrendConfig = {
  failures: { label: 'Failures', color: SEMANTIC.danger },
  total: { label: 'Total Jobs', color: CHART_COLORS[1] },
} satisfies ChartConfig;

const toolErrorConfig = {
  completed: { label: 'Completed', color: SEMANTIC.success },
  failed: { label: 'Failed', color: SEMANTIC.danger },
} satisfies ChartConfig;

const ReliabilityPage = () => {
  const { days } = useAdminTimeRange();
  const { data, isLoading, isError, refetch } = useReliability(days);
  const d = data;
  const rate = (d?.jobRate?.successRate ?? 0) * 100;

  const completedTrend = computeDelta(
    seriesFrom(d?.errorTrend, (row) => row.total - row.failures),
  );
  const failedTrend = computeDelta(seriesFrom(d?.errorTrend, (row) => row.failures));

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Reliability Metrics"
        description="Job success rates, processing time, and error analysis"
      />

      {isError ? (
        <MetricsErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard
              label="Success Rate"
              value={`${rate.toFixed(1)}%`}
              icon={ShieldCheck}
              tone="success"
              color={rateToneClass(rate)}
              isLoading={isLoading}
            />
            <StatCard
              label="Completed"
              value={d?.jobRate?.completed}
              icon={CheckCircle2}
              tone="success"
              color="text-success"
              isLoading={isLoading}
              trend={completedTrend ?? undefined}
            />
            <StatCard
              label="Failed"
              value={d?.jobRate?.failed}
              icon={XCircle}
              tone="destructive"
              color="text-destructive"
              isLoading={isLoading}
              trend={failedTrend ? { ...failedTrend, invertGood: true } : undefined}
            />
            <StatCard
              label="P50 Latency"
              value={`${(d?.processingTime?.p50Seconds ?? 0).toFixed(2)}s`}
              icon={Clock}
              tone="info"
              isLoading={isLoading}
            />
            <StatCard
              label="P95 Latency"
              value={`${(d?.processingTime?.p95Seconds ?? 0).toFixed(2)}s`}
              icon={Clock}
              tone="warning"
              isLoading={isLoading}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Error Trend</CardTitle>
              <CardDescription>Daily failures vs total jobs — last {days} days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                <ChartContainer config={errorTrendConfig} className="h-[300px] w-full">
                  <AreaChart data={d?.errorTrend ?? []} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid {...GRID_PROPS} vertical={false} />
                    <XAxis dataKey="date" {...AXIS_PROPS} tickMargin={8} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis {...AXIS_PROPS} width={40} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area dataKey="total" type="monotone" fill="var(--color-total)" fillOpacity={0.1} stroke="var(--color-total)" strokeWidth={2}
                      isAnimationActive animationDuration={800} animationEasing="ease-out" />
                    <Area dataKey="failures" type="monotone" fill="var(--color-failures)" fillOpacity={0.3} stroke="var(--color-failures)" strokeWidth={2}
                      isAnimationActive animationDuration={800} animationEasing="ease-out" />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tool-Specific Error Rates</CardTitle>
              <CardDescription>Completed vs failed by tool</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                <ChartContainer config={toolErrorConfig} className="h-[300px] w-full">
                  <BarChart data={d?.toolErrors ?? []} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid {...GRID_PROPS} horizontal={false} />
                    <XAxis type="number" {...AXIS_PROPS} />
                    <YAxis type="category" dataKey="toolType" {...AXIS_PROPS} fontSize={11} width={80} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="completed" fill="var(--color-completed)" radius={[0, 4, 4, 0]}
                      isAnimationActive animationDuration={800} animationEasing="ease-out" />
                    <Bar dataKey="failed" fill="var(--color-failed)" radius={[0, 4, 4, 0]}
                      isAnimationActive animationDuration={800} animationEasing="ease-out" />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {(d?.planLimitHits?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Plan Limit Hits</CardTitle>
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
