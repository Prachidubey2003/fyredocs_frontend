import { Layout } from '@/components/layout/Layout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
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
import { useBusiness } from '@/hooks/useAdminMetrics';

const signupsChartConfig = {
  signups: { label: 'Signups', color: 'hsl(142, 71%, 45%)' },
} satisfies ChartConfig;

const planChangesChartConfig = {
  upgrades: { label: 'Upgrades', color: 'hsl(217, 91%, 60%)' },
  downgrades: { label: 'Downgrades', color: 'hsl(0, 84%, 60%)' },
} satisfies ChartConfig;

const BusinessPage = () => {
  const { data, isLoading } = useBusiness(30);
  const d = data?.data;

  const churnRate = d?.churn?.churnRate ?? 0;
  const conversionRate = d?.conversionRate?.rate ?? 0;

  return (
    <Layout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <AdminPageHeader
          title="Business Metrics"
          description="Signups, plan changes, churn, and conversion"
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
                    <Bar dataKey="upgrades" fill="var(--color-upgrades)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="downgrades" fill="var(--color-downgrades)" radius={[4, 4, 0, 0]} />
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
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-48" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-sm text-muted-foreground">Churned Users</span>
                    <span className="text-lg font-semibold text-red-600">
                      {d?.churn?.churned ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-sm text-muted-foreground">Previous Active Users</span>
                    <span className="text-lg font-semibold">{d?.churn?.previousActive ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Churn Rate</span>
                    <span
                      className={`text-lg font-semibold ${churnRate > 0.1 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {(churnRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </>
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
                <p className="text-sm text-muted-foreground">
                  {d?.revenue?.note ?? 'Revenue tracking is not yet available.'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default BusinessPage;
