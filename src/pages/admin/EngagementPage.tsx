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
import { Bar, BarChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEngagement } from '@/hooks/useAdminMetrics';

const COLORS = ['hsl(24, 95%, 53%)', 'hsl(217, 91%, 60%)'];

function formatBucket(bucket: string): string {
  const map: Record<string, string> = {
    under_1mb: '< 1 MB',
    '1mb_5mb': '1-5 MB',
    '5mb_10mb': '5-10 MB',
    '10mb_25mb': '10-25 MB',
    '25mb_50mb': '25-50 MB',
    '50mb_100mb': '50-100 MB',
    over_100mb: '> 100 MB',
  };
  return map[bucket] ?? bucket.replace(/_/g, ' ');
}

const fileSizeChartConfig: ChartConfig = {
  count: {
    label: 'Count',
    color: 'hsl(217, 91%, 60%)',
  },
};

const pieChartConfig: ChartConfig = {
  guest: {
    label: 'Guest',
    color: COLORS[0],
  },
  registered: {
    label: 'Registered',
    color: COLORS[1],
  },
};

const EngagementPage = () => {
  const { data, isLoading } = useEngagement(30);
  const d = data;

  const fileSizeData = (d?.fileSizeDistribution ?? []).map(
    (item: { bucket: string; count: number }) => ({
      ...item,
      bucket: formatBucket(item.bucket),
    }),
  );

  const pieData = d?.guestVsRegistered
    ? [
        { name: 'Guest', value: d.guestVsRegistered.guestEvents },
        { name: 'Registered', value: d.guestVsRegistered.registeredEvents },
      ]
    : [];

  return (
    <Layout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <AdminPageHeader
          title="Engagement Metrics"
          description="Tool adoption, usage patterns, and power users"
        />

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Avg Jobs/User"
            value={d?.jobsPerUser?.average != null ? d.jobsPerUser.average.toFixed(1) : undefined}
            isLoading={isLoading}
          />
          <StatCard
            label="Median Jobs/User"
            value={d?.jobsPerUser?.median ?? undefined}
            isLoading={isLoading}
          />
          <StatCard
            label="Unique Registered Users"
            value={d?.uniqueRegisteredUsers ?? undefined}
            isLoading={isLoading}
          />
          <StatCard
            label="Guest Events"
            value={d?.guestVsRegistered?.guestEvents ?? undefined}
            isLoading={isLoading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* File Size Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>File Size Distribution</CardTitle>
              <CardDescription>Number of jobs by uploaded file size</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ChartContainer config={fileSizeChartConfig} className="h-[300px] w-full">
                  <BarChart data={fileSizeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="bucket" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]}
                      isAnimationActive animationDuration={800} animationEasing="ease-out" />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Guest vs Registered */}
          <Card>
            <CardHeader>
              <CardTitle>Guest vs Registered</CardTitle>
              <CardDescription>Event distribution by user type</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      isAnimationActive
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {pieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Power Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Power Users</CardTitle>
            <CardDescription>Top 20 users by job count</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead className="text-right">Job Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(d?.powerUsers ?? []).slice(0, 20).map(
                    (user: { userId: string; jobCount: number }, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">
                          {user.userId.length > 12
                            ? `${user.userId.slice(0, 8)}...${user.userId.slice(-4)}`
                            : user.userId}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {user.jobCount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EngagementPage;
