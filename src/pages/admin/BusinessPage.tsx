import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { AnimatedNumber } from '@/components/admin/AnimatedNumber';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
} from 'recharts';
import { ProgressRing } from '@/components/admin/ProgressRing';
import { DollarSign } from 'lucide-react';
import { useBusiness } from '@/hooks/useAdminMetrics';

const signupsChartConfig = {
  signups: { label: 'Signups', color: 'hsl(142, 71%, 45%)' },
} satisfies ChartConfig;

const planChangesChartConfig = {
  upgrades: { label: 'Upgrades', color: 'hsl(217, 91%, 60%)' },
  downgrades: { label: 'Downgrades', color: 'hsl(0, 84%, 60%)' },
} satisfies ChartConfig;

const BusinessPage = () => {
  const queryClient = useQueryClient();
  const handleRefresh = useCallback(() => queryClient.resetQueries({ queryKey: ['admin', 'business'] }), [queryClient]);
  const { data, isLoading } = useBusiness(30);
  const d = data;

  const churnRate = d?.churn?.churnRate ?? 0;
  const conversionRate = d?.conversionRate?.rate ?? 0;

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <AdminPageHeader
          title="Business Metrics"
          description="Signups, plan changes, churn, and conversion"
          onRefresh={handleRefresh}
        />

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Signups"
            value={d?.signups?.total}
            color="text-green-600"
            isLoading={isLoading}
          />
          <StatCard
            label="Churn Rate"
            value={`${(churnRate * 100).toFixed(1)}%`}
            color={churnRate > 0.1 ? 'text-red-600' : 'text-foreground'}
            isLoading={isLoading}
          />
          <StatCard
            label="Conversion Rate"
            value={`${(conversionRate * 100).toFixed(1)}%`}
            isLoading={isLoading}
          />
          <StatCard
            label="Free Upgrades"
            value={d?.conversionRate?.freeUpgrades}
            isLoading={isLoading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Signups Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Signups Over Time</CardTitle>
              <CardDescription>Daily signups for the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ChartContainer config={signupsChartConfig} className="h-64 w-full">
                  <AreaChart data={d?.signups?.daily ?? []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: string) => v.slice(5)}
                    />
                    <YAxis tickLine={false} axisLine={false} />
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
                <Skeleton className="h-64 w-full" />
              ) : (
                <ChartContainer config={planChangesChartConfig} className="h-64 w-full">
                  <BarChart data={d?.planChanges ?? []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: string) => v.slice(5)}
                    />
                    <YAxis tickLine={false} axisLine={false} />
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
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Churn Details */}
          <Card>
            <CardHeader>
              <CardTitle>Churn Details</CardTitle>
              <CardDescription>User churn breakdown for the period</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-16 w-16 mx-auto rounded-full" />
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between border-b pb-3">
                      <span className="text-sm text-muted-foreground">Churned Users</span>
                      <span className="text-lg font-semibold text-red-600">
                        <AnimatedNumber value={d?.churn?.churned ?? 0} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b pb-3">
                      <span className="text-sm text-muted-foreground">Previous Active</span>
                      <span className="text-lg font-semibold"><AnimatedNumber value={d?.churn?.previousActive ?? 0} /></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Churn Rate</span>
                      <span className={`text-lg font-semibold ${churnRate > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                        <AnimatedNumber value={churnRate * 100} decimals={1} suffix="%" />
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <ProgressRing
                      value={churnRate * 100}
                      size={80}
                      strokeWidth={8}
                      color={churnRate > 0.1 ? 'hsl(0, 84%, 60%)' : 'hsl(142, 71%, 45%)'}
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
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                    <DollarSign className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {d?.revenue?.note ?? 'Revenue tracking is not yet available.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default BusinessPage;
