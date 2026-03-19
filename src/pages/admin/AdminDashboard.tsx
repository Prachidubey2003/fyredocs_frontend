import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  useOverview,
  useUserGrowth,
  useToolUsage,
  usePlanDistribution,
  useRealtime,
} from '@/hooks/useAdminMetrics';

const chartConfig = {
  signups: { label: 'Signups', color: 'hsl(var(--chart-1))' },
  dau: { label: 'DAU', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig;

function OverviewCards() {
  const { data, isLoading } = useOverview();
  const d = data?.data;

  const cards = [
    { title: 'Signups Today', value: d?.signups, color: 'text-green-600' },
    { title: 'DAU', value: d?.dau, color: 'text-blue-600' },
    { title: 'Jobs Created', value: d?.jobsCreated, color: 'text-purple-600' },
    { title: 'Jobs Failed', value: d?.jobsFailed, color: 'text-red-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardDescription>{card.title}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className={`text-3xl font-bold ${card.color}`}>{card.value ?? 0}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SecondaryStats() {
  const { data, isLoading } = useOverview();
  const d = data?.data;

  const stats = [
    { label: 'Logins', value: d?.logins },
    { label: 'Guest Sessions', value: d?.guestSessions },
    { label: 'Jobs Completed', value: d?.jobsCompleted },
    { label: 'Plan Limit Hits', value: d?.planLimitHits },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-2">
            <CardDescription>{stat.label}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 w-12" />
            ) : (
              <p className="text-xl font-semibold">{stat.value ?? 0}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UserGrowthChart() {
  const { data, isLoading } = useUserGrowth(90);
  const rows = data?.data?.rows ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth</CardTitle>
        <CardDescription>Signups and daily active users — last 90 days</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No data yet</p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8}
                tickFormatter={(v: string) => v.slice(5)} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area dataKey="signups" type="monotone" fill="var(--color-signups)" fillOpacity={0.2}
                stroke="var(--color-signups)" strokeWidth={2} />
              <Area dataKey="dau" type="monotone" fill="var(--color-dau)" fillOpacity={0.2}
                stroke="var(--color-dau)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function ToolUsageTable() {
  const { data, isLoading } = useToolUsage(30);
  const rows = data?.data?.rows ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tool Usage</CardTitle>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No data yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead className="text-right">Success Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const rate = row.count > 0 ? Math.round((row.completed / row.count) * 100) : 0;
                return (
                  <TableRow key={row.toolType}>
                    <TableCell className="font-medium">{row.toolType}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{row.completed}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.failed > 0 ? (
                        <Badge variant="destructive">{row.failed}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={rate >= 90 ? 'text-green-600' : rate >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                        {rate}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function PlanDistributionCard() {
  const { data, isLoading } = usePlanDistribution(30);
  const rows = data?.data?.rows ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Distribution</CardTitle>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[150px] w-full" />
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No data yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Users</TableHead>
                <TableHead className="text-right">Jobs</TableHead>
                <TableHead className="text-right">Limit Hits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.planName}>
                  <TableCell className="font-medium capitalize">{row.planName}</TableCell>
                  <TableCell className="text-right">{row.users}</TableCell>
                  <TableCell className="text-right">{row.jobs}</TableCell>
                  <TableCell className="text-right">
                    {row.limitHits > 0 ? (
                      <Badge variant="outline" className="border-orange-400 text-orange-600">
                        {row.limitHits} (upgrade opportunity)
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function RealtimeFeed() {
  const { data, isLoading } = useRealtime();
  const rows = data?.data?.rows ?? [];

  const eventLabels: Record<string, string> = {
    'user.signup': 'Signups',
    'user.login': 'Logins',
    'job.created': 'Jobs Created',
    'job.completed': 'Jobs Completed',
    'job.failed': 'Jobs Failed',
    'plan.limit_hit': 'Plan Limit Hits',
  };

  const eventVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'user.signup': 'default',
    'user.login': 'secondary',
    'job.created': 'outline',
    'job.completed': 'default',
    'job.failed': 'destructive',
    'plan.limit_hit': 'outline',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Realtime</CardTitle>
        <CardDescription>Events in the last hour (auto-refreshes every 15s)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[100px] w-full" />
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No events in the last hour</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {rows.map((row) => (
              <div key={row.eventType} className="flex items-center gap-2">
                <Badge variant={eventVariants[row.eventType] ?? 'secondary'}>
                  {eventLabels[row.eventType] ?? row.eventType}
                </Badge>
                <span className="text-lg font-semibold">{row.count}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const AdminDashboard = () => {
  return (
    <Layout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Business metrics and platform health</p>
        </div>

        <OverviewCards />
        <SecondaryStats />

        <div className="grid gap-6 lg:grid-cols-2">
          <UserGrowthChart />
          <RealtimeFeed />
        </div>

        <ToolUsageTable />
        <PlanDistributionCard />
      </div>
    </Layout>
  );
};

export default AdminDashboard;
