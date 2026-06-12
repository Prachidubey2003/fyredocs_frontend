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
import { ProgressRing } from '@/components/admin/ProgressRing';
import { DollarSign, UserPlus, TrendingDown, Percent, ArrowUpCircle } from 'lucide-react';
import { useBusiness } from '@/hooks/useAdminMetrics';
import { useAdminTimeRange } from '@/hooks/useAdminTimeRange';
import { AXIS_PROPS, CHART_COLORS, GRID_PROPS, SEMANTIC } from '@/components/admin/chartTheme';
import { computeDelta, seriesFrom } from '@/lib/adminTrends';

const signupsChartConfig = {
  signups: { label: 'Signups', color: SEMANTIC.success },
} satisfies ChartConfig;

const planChangesChartConfig = {
  upgrades: { label: 'Upgrades', color: CHART_COLORS[1] },
  downgrades: { label: 'Downgrades', color: SEMANTIC.danger },
} satisfies ChartConfig;

const BusinessPage = () => {
  const { days } = useAdminTimeRange();
  const { data, isLoading, isError, refetch } = useBusiness(days);
  const d = data;

  const churnRate = d?.churn?.churnRate ?? 0;
  const conversionRate = d?.conversionRate?.rate ?? 0;
  const signupsTrend = computeDelta(seriesFrom(d?.signups?.daily, (row) => row.signups));

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Business Metrics"
        description="Signups, plan changes, churn, and conversion"
      />

      {isError ? (
        <MetricsErrorState onRetry={() => refetch()} />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Signups"
              value={d?.signups?.total}
              icon={UserPlus}
              tone="success"
              color="text-success"
              isLoading={isLoading}
              trend={signupsTrend ?? undefined}
            />
            <StatCard
              label="Churn Rate"
              value={`${(churnRate * 100).toFixed(1)}%`}
              icon={TrendingDown}
              tone="destructive"
              color={churnRate > 0.1 ? 'text-destructive' : 'text-foreground'}
              isLoading={isLoading}
            />
            <StatCard
              label="Conversion Rate"
              value={`${(conversionRate * 100).toFixed(1)}%`}
              icon={Percent}
              tone="info"
              isLoading={isLoading}
            />
            <StatCard
              label="Free Upgrades"
              value={d?.conversionRate?.freeUpgrades}
              icon={ArrowUpCircle}
              tone="brand"
              isLoading={isLoading}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Signups Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Signups Over Time</CardTitle>
                <CardDescription>Daily signups for the last {days} days</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ChartContainer config={signupsChartConfig} className="h-[300px] w-full">
                    <AreaChart data={d?.signups?.daily ?? []}>
                      <CartesianGrid {...GRID_PROPS} vertical={false} />
                      <XAxis
                        dataKey="date"
                        {...AXIS_PROPS}
                        tickFormatter={(v: string) => v.slice(5)}
                      />
                      <YAxis {...AXIS_PROPS} width={40} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="signups"
                        stroke="var(--color-signups)"
                        fill="var(--color-signups)"
                        fillOpacity={0.2}
                        strokeWidth={2}
                        isAnimationActive
                        animationDuration={800}
                        animationEasing="ease-out"
                      />
                    </AreaChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Plan Changes */}
            <Card>
              <CardHeader>
                <CardTitle>Plan Changes</CardTitle>
                <CardDescription>Upgrades and downgrades over time</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ChartContainer config={planChangesChartConfig} className="h-[300px] w-full">
                    <BarChart data={d?.planChanges ?? []}>
                      <CartesianGrid {...GRID_PROPS} vertical={false} />
                      <XAxis
                        dataKey="date"
                        {...AXIS_PROPS}
                        tickFormatter={(v: string) => v.slice(5)}
                      />
                      <YAxis {...AXIS_PROPS} width={40} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="upgrades" fill="var(--color-upgrades)" radius={[4, 4, 0, 0]}
                        isAnimationActive animationDuration={800} animationEasing="ease-out" />
                      <Bar dataKey="downgrades" fill="var(--color-downgrades)" radius={[4, 4, 0, 0]}
                        isAnimationActive animationDuration={800} animationEasing="ease-out" />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Churn Details */}
            <Card>
              <CardHeader>
                <CardTitle>Churn Details</CardTitle>
                <CardDescription>User churn breakdown for the period</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center gap-6">
                    <div className="flex-1 space-y-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                      ))}
                    </div>
                    <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
                  </div>
                ) : (
                  <div className="flex items-center gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between border-b pb-3">
                        <span className="text-sm text-muted-foreground">Churned Users</span>
                        <span className="text-lg font-semibold text-destructive">
                          <AnimatedNumber value={d?.churn?.churnedUsers ?? 0} />
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b pb-3">
                        <span className="text-sm text-muted-foreground">Previous Active</span>
                        <span className="text-lg font-semibold"><AnimatedNumber value={d?.churn?.previousActiveUsers ?? 0} /></span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Churn Rate</span>
                        <span className={`text-lg font-semibold ${churnRate > 0.1 ? 'text-destructive' : 'text-success'}`}>
                          <AnimatedNumber value={churnRate * 100} decimals={1} suffix="%" />
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <ProgressRing
                        value={churnRate * 100}
                        size={80}
                        strokeWidth={8}
                        color={churnRate > 0.1 ? SEMANTIC.danger : SEMANTIC.success}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue</CardTitle>
                <CardDescription>Coming Soon</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                    <DollarSign className="h-8 w-8 opacity-50" aria-hidden />
                    <p className="text-sm">
                      {d?.revenue?.note ?? 'Revenue tracking is not yet available.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default BusinessPage;
