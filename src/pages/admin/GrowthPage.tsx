import { Layout } from '@/components/layout/Layout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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

function retentionBadgeVariant(value: number): 'default' | 'secondary' | 'destructive' {
  if (value > 50) return 'default';
  if (value > 20) return 'secondary';
  return 'destructive';
}

const GrowthPage = () => {
  const { data, isLoading } = useGrowth(30);
  const d = data?.data;

  return (
    <Layout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <AdminPageHeader
          title="Growth Metrics"
          description="DAU/WAU/MAU, activation, retention, and conversion funnel"
        />

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="DAU"
            value={d?.dau}
            color="text-blue-600"
            isLoading={isLoading}
          />
          <StatCard
            label="WAU"
            value={d?.wau}
            isLoading={isLoading}
          />
          <StatCard
            label="MAU"
            value={d?.mau}
            isLoading={isLoading}
          />
          <StatCard
            label="Stickiness Ratio"
            value={d?.stickiness != null ? `${(d.stickiness * 100).toFixed(1)}%` : null}
            subtitle="DAU / MAU"
            isLoading={isLoading}
          />
        </div>

        {/* DAU Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>DAU Trend</CardTitle>
            <CardDescription>Daily active users over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : d?.dauTrend ? (
              <ChartContainer config={dauChartConfig} className="h-[300px] w-full">
                <AreaChart data={d.dauTrend} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
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
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <p className="py-8 text-center text-muted-foreground">No trend data available</p>
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
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-10 w-32" />
                </div>
              ) : d?.activationRate ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Signups</span>
                    <span className="text-lg font-semibold">{d.activationRate.signups}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Activated</span>
                    <span className="text-lg font-semibold text-green-600">
                      {d.activationRate.activated}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Activation Rate</span>
                    <span className="text-3xl font-bold text-blue-600">
                      {(d.activationRate.rate * 100).toFixed(1)}%
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
                <Skeleton className="h-[200px] w-full" />
              ) : d?.funnel ? (
                <ChartContainer config={funnelChartConfig} className="h-[200px] w-full">
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
                    <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} />
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
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : d?.retention?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cohort Date</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                    <TableHead className="text-right">D1 (%)</TableHead>
                    <TableHead className="text-right">D7 (%)</TableHead>
                    <TableHead className="text-right">D30 (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.retention.map(
                    (cohort: {
                      cohortDate: string;
                      size: number;
                      d1: number;
                      d7: number;
                      d30: number;
                    }) => (
                      <TableRow key={cohort.cohortDate}>
                        <TableCell className="font-medium">{cohort.cohortDate}</TableCell>
                        <TableCell className="text-right">{cohort.size}</TableCell>
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
                    ),
                  )}
                </TableBody>
              </Table>
            ) : (
              <p className="py-8 text-center text-muted-foreground">No retention data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GrowthPage;
