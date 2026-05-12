import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';
import { useReliability } from '@/hooks/useAdminMetrics';

const errorTrendConfig = {
  failures: { label: 'Failures', color: 'hsl(0, 84%, 60%)' },
  total: { label: 'Total Jobs', color: 'hsl(217, 91%, 60%)' },
} satisfies ChartConfig;

const toolErrorConfig = {
  completed: { label: 'Completed', color: 'hsl(142, 71%, 45%)' },
  failed: { label: 'Failed', color: 'hsl(0, 84%, 60%)' },
} satisfies ChartConfig;

const ReliabilityPage = () => {
  const queryClient = useQueryClient();
  const handleRefresh = useCallback(() => queryClient.resetQueries({ queryKey: ['admin', 'reliability'] }), [queryClient]);
  const { data, isLoading } = useReliability(30);
  const d = data;
  const rate = (d?.jobRate?.successRate ?? 0) * 100;

  return (
    <>
      <div className="space-y-6 px-4 py-8">
        <AdminPageHeader title="Reliability Metrics" description="Job success rates, processing time, and error analysis" onRefresh={handleRefresh} />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Card className="overflow-hidden">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs leading-tight text-muted-foreground">Success Rate</p>
                {isLoading ? (
                  <Skeleton className="mt-1 h-8 w-20" />
                ) : (
                  <p className={`text-3xl font-bold leading-tight ${rate >= 95 ? 'text-green-600' : rate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {rate.toFixed(1)}%
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          <StatCard
            label="Completed"
            value={d?.jobRate?.completed}
            icon={CheckCircle2}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-500/10"
            color="text-green-600"
            isLoading={isLoading}
          />
          <StatCard
            label="Failed"
            value={d?.jobRate?.failed}
            icon={XCircle}
            iconColor="text-red-600"
            iconBg="bg-red-500/10"
            color="text-red-600"
            isLoading={isLoading}
          />
          <StatCard
            label="P50 Latency"
            value={`${(d?.processingTime?.p50Seconds ?? 0).toFixed(2)}s`}
            icon={Clock}
            iconColor="text-sky-600"
            iconBg="bg-sky-500/10"
            isLoading={isLoading}
          />
          <StatCard
            label="P95 Latency"
            value={`${(d?.processingTime?.p95Seconds ?? 0).toFixed(2)}s`}
            icon={Clock}
            iconColor="text-orange-600"
            iconBg="bg-orange-500/10"
            color="text-orange-600"
            isLoading={isLoading}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Error Trend</CardTitle>
            <CardDescription>Daily failures vs total jobs — last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
              <ChartContainer config={errorTrendConfig} className="h-[300px] w-full">
                <AreaChart data={d?.errorTrend ?? []} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v: string) => v.slice(5)} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
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
                <BarChart data={d?.toolErrors ?? []} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis type="category" dataKey="toolType" tickLine={false} axisLine={false} fontSize={11} width={80} />
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
                    <TableRow key={i} className="hover:bg-muted/50 transition-colors">
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="capitalize">{row.planName}</TableCell>
                      <TableCell className="text-right font-medium text-orange-600">{row.hits}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default ReliabilityPage;
