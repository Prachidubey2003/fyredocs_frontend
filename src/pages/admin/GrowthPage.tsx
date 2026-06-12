import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { AnimatedNumber } from '@/components/admin/AnimatedNumber';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Repeat } from 'lucide-react';
import { useGrowth } from '@/hooks/useAdminMetrics';
import { useAdminTimeRange } from '@/hooks/useAdminTimeRange';
import { AXIS_PROPS, CHART_COLORS, GRID_PROPS } from '@/components/admin/chartTheme';
import { computeDelta, seriesFrom } from '@/lib/adminTrends';

const dauChartConfig = {
  dau: { label: 'DAU', color: CHART_COLORS[1] },
} satisfies ChartConfig;

const funnelChartConfig = {
  value: { label: 'Users', color: CHART_COLORS[4] },
} satisfies ChartConfig;

/** Subtle chip classes for a retention percentage (higher is better). */
function retentionChipClass(value: number): string {
  if (value > 50) return 'bg-success-subtle text-success-subtle-foreground';
  if (value > 20) return 'bg-warning-subtle text-warning-subtle-foreground';
  return 'bg-destructive-subtle text-destructive-subtle-foreground';
}

function RetentionChip({ value }: { value: number }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${retentionChipClass(value)}`}
    >
      {value.toFixed(1)}%
    </span>
  );
}

const GrowthPage = () => {
  const { days } = useAdminTimeRange();
  const { data, isLoading, isError, refetch } = useGrowth(days);
  const d = data;

  const dauTrend = computeDelta(seriesFrom(d?.dauTrend, (row) => row.dau));

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Growth Metrics"
        description="DAU/WAU/MAU, activation, retention, and conversion funnel"
      />

      {isError ? (
        <MetricsErrorState onRetry={() => refetch()} />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="DAU"
              value={d?.dau}
              icon={Users}
              tone="brand"
              isLoading={isLoading}
              trend={dauTrend ?? undefined}
            />
            <StatCard
              label="WAU"
              value={d?.wau}
              icon={Users}
              tone="info"
              isLoading={isLoading}
            />
            <StatCard
              label="MAU"
              value={d?.mau}
              icon={Users}
              tone="info"
              isLoading={isLoading}
            />
            <StatCard
              label="Stickiness Ratio"
              value={d?.stickiness != null ? `${(d.stickiness * 100).toFixed(1)}%` : null}
              icon={Repeat}
              tone="success"
              subtitle="DAU / MAU"
              isLoading={isLoading}
            />
          </div>

          {/* DAU Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>DAU Trend</CardTitle>
              <CardDescription>Daily active users over the last {days} days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : d?.dauTrend ? (
                <ChartContainer config={dauChartConfig} className="h-[300px] w-full">
                  <AreaChart data={d.dauTrend} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid {...GRID_PROPS} vertical={false} />
                    <XAxis dataKey="date" {...AXIS_PROPS} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis {...AXIS_PROPS} width={40} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="dau"
                      stroke="var(--color-dau)"
                      fill="var(--color-dau)"
                      fillOpacity={0.2}
                      strokeWidth={2}
                      isAnimationActive
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <p className="py-8 text-center text-muted-foreground">No trend data available</p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Activation Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Activation Rate</CardTitle>
                <CardDescription>Signup to activation conversion</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-9 w-24" />
                    </div>
                  </div>
                ) : d?.activationRate ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Signups</span>
                      <span className="text-lg font-semibold"><AnimatedNumber value={d.activationRate.signups} /></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Activated</span>
                      <span className="text-lg font-semibold text-success">
                        <AnimatedNumber value={d.activationRate.activated} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Activation Rate</span>
                      <span className="text-3xl font-bold text-primary">
                        <AnimatedNumber value={d.activationRate.rate * 100} decimals={1} suffix="%" />
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground">No activation data available</p>
                )}
              </CardContent>
            </Card>

            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>User progression through key stages</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : d?.funnel ? (
                  <ChartContainer config={funnelChartConfig} className="h-[300px] w-full">
                    <BarChart
                      layout="vertical"
                      data={[
                        { stage: 'Signed Up', value: d.funnel.signedUp },
                        { stage: 'Created Job', value: d.funnel.createdJob },
                        { stage: 'Completed Job', value: d.funnel.completedJob },
                        { stage: 'Repeat User', value: d.funnel.repeatUser },
                      ]}
                      margin={{ top: 0, right: 10, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid {...GRID_PROPS} horizontal={false} />
                      <XAxis type="number" {...AXIS_PROPS} />
                      <YAxis type="category" dataKey="stage" {...AXIS_PROPS} width={96} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]}
                        isAnimationActive animationDuration={800} animationEasing="ease-out" />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="py-8 text-center text-muted-foreground">No funnel data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Retention Cohorts */}
          <Card>
            <CardHeader>
              <CardTitle>Retention Cohorts</CardTitle>
              <CardDescription>User retention by signup cohort</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
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
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-12" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="ml-auto h-5 w-14" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="ml-auto h-5 w-14" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="ml-auto h-5 w-14" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : d?.retention?.length ? (
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
                <p className="py-8 text-center text-muted-foreground">No retention data available</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default GrowthPage;
