import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { AnimatedNumber } from '@/components/admin/AnimatedNumber';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
} from 'recharts';
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

const dauChartConfig = {
  dau: { label: 'DAU', color: 'hsl(217, 91%, 60%)' },
} satisfies ChartConfig;

const funnelChartConfig = {
  value: { label: 'Users', color: 'hsl(262, 83%, 58%)' },
} satisfies ChartConfig;

function retentionColor(value: number): string {
  if (value > 50) return 'text-green-600';
  if (value > 20) return 'text-yellow-600';
  return 'text-red-600';
}

function retentionBadgeVariant(
  value: number
): 'default' | 'secondary' | 'destructive' {
  if (value > 50) return 'default';
  if (value > 20) return 'secondary';
  return 'destructive';
}

const GrowthPage = () => {
  const queryClient = useQueryClient();
  const handleRefresh = useCallback(
    () => queryClient.resetQueries({ queryKey: ['admin', 'growth'] }),
    [queryClient]
  );
  const { data, isLoading } = useGrowth(30);
  const d = data;

  return (
    <>
      <div className="space-y-6 px-4 py-8">
        <AdminPageHeader
          title="Growth Metrics"
          description="DAU/WAU/MAU, activation, retention, and conversion funnel"
          onRefresh={handleRefresh}
        />

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="DAU"
            value={d?.dau}
            icon={Users}
            iconColor="text-blue-600"
            iconBg="bg-blue-500/10"
            color="text-blue-600"
            isLoading={isLoading}
          />
          <StatCard
            label="WAU"
            value={d?.wau}
            icon={Users}
            iconColor="text-cyan-600"
            iconBg="bg-cyan-500/10"
            isLoading={isLoading}
          />
          <StatCard
            label="MAU"
            value={d?.mau}
            icon={Users}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-500/10"
            isLoading={isLoading}
          />
          <StatCard
            label="Stickiness Ratio"
            value={
              d?.stickiness != null
                ? `${(d.stickiness * 100).toFixed(1)}%`
                : null
            }
            icon={Repeat}
            iconColor="text-violet-600"
            iconBg="bg-violet-500/10"
            subtitle="DAU / MAU"
            isLoading={isLoading}
          />
        </div>

        {/* DAU Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>DAU Trend</CardTitle>
            <CardDescription>
              Daily active users over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : d?.dauTrend ? (
              <ChartContainer
                config={dauChartConfig}
                className="h-[300px] w-full"
              >
                <AreaChart
                  data={d.dauTrend}
                  margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
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
              <p className="py-8 text-center text-muted-foreground">
                No trend data available
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
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
                    <span className="text-sm text-muted-foreground">
                      Total Signups
                    </span>
                    <span className="text-lg font-semibold">
                      <AnimatedNumber value={d.activationRate.signups} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Activated
                    </span>
                    <span className="text-lg font-semibold text-green-600">
                      <AnimatedNumber value={d.activationRate.activated} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Activation Rate
                    </span>
                    <span className="text-3xl font-bold text-blue-600">
                      <AnimatedNumber
                        value={d.activationRate.rate * 100}
                        decimals={1}
                        suffix="%"
                      />
                    </span>
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  No activation data available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>
                User progression through key stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : d?.funnel ? (
                <ChartContainer
                  config={funnelChartConfig}
                  className="h-[300px] w-full"
                >
                  <BarChart
                    layout="vertical"
                    data={[
                      { stage: 'Signed Up', value: d.funnel.signedUp },
                      { stage: 'Created Job', value: d.funnel.createdJob },
                      { stage: 'Completed Job', value: d.funnel.completedJob },
                      { stage: 'Repeat User', value: d.funnel.repeatUser },
                    ]}
                    margin={{ top: 0, right: 10, bottom: 0, left: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="stage"
                      tickLine={false}
                      axisLine={false}
                      width={75}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="value"
                      fill="var(--color-value)"
                      radius={[0, 4, 4, 0]}
                      isAnimationActive
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  No funnel data available
                </p>
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
                    <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Cohort Date
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Size
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      D1 (%)
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      D7 (%)
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      D30 (%)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-4 w-12" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-5 w-14" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-5 w-14" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-5 w-14" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : d?.retention?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Cohort Date
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Size
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      D1 (%)
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      D7 (%)
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      D30 (%)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.retention.map(
                    (cohort: {
                      cohortDate: string;
                      cohortSize: number;
                      d1: number;
                      d7: number;
                      d30: number;
                    }) => (
                      <TableRow
                        key={cohort.cohortDate}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {cohort.cohortDate}
                        </TableCell>
                        <TableCell className="text-right">
                          {cohort.cohortSize}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={retentionBadgeVariant(cohort.d1)}>
                            <span className={retentionColor(cohort.d1)}>
                              {cohort.d1.toFixed(1)}%
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={retentionBadgeVariant(cohort.d7)}>
                            <span className={retentionColor(cohort.d7)}>
                              {cohort.d7.toFixed(1)}%
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={retentionBadgeVariant(cohort.d30)}>
                            <span className={retentionColor(cohort.d30)}>
                              {cohort.d30.toFixed(1)}%
                            </span>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                No retention data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default GrowthPage;
