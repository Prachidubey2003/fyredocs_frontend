import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
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
import { AnimatedNumber } from '@/components/admin/AnimatedNumber';
import { Briefcase, UserCheck, UserCircle } from 'lucide-react';
import { useEngagement } from '@/hooks/useAdminMetrics';
import { useAdminTimeRange } from '@/hooks/useAdminTimeRange';
import { AXIS_PROPS, CHART_COLORS, GRID_PROPS } from '@/components/admin/chartTheme';

const PIE_COLORS = [CHART_COLORS[5], CHART_COLORS[1]];

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

const fileSizeChartConfig = {
  count: { label: 'Count', color: CHART_COLORS[1] },
} satisfies ChartConfig;

const pieChartConfig = {
  guest: { label: 'Guest', color: PIE_COLORS[0] },
  registered: { label: 'Registered', color: PIE_COLORS[1] },
} satisfies ChartConfig;

const EngagementPage = () => {
  const { days } = useAdminTimeRange();
  const { data, isLoading, isError, refetch } = useEngagement(days);
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
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Engagement Metrics"
        description="Tool adoption, usage patterns, and power users"
      />

      {isError ? (
        <MetricsErrorState onRetry={() => refetch()} />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Avg Jobs/User"
              value={d?.jobsPerUser?.average != null ? d.jobsPerUser.average.toFixed(1) : undefined}
              icon={Briefcase}
              tone="brand"
              isLoading={isLoading}
            />
            <StatCard
              label="Median Jobs/User"
              value={d?.jobsPerUser?.median ?? undefined}
              icon={Briefcase}
              tone="info"
              isLoading={isLoading}
            />
            <StatCard
              label="Unique Registered Users"
              value={d?.guestVsRegistered?.uniqueRegistered ?? undefined}
              icon={UserCheck}
              tone="success"
              isLoading={isLoading}
            />
            <StatCard
              label="Guest Events"
              value={d?.guestVsRegistered?.guestEvents ?? undefined}
              icon={UserCircle}
              tone="default"
              isLoading={isLoading}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                      <CartesianGrid {...GRID_PROPS} vertical={false} />
                      <XAxis dataKey="bucket" {...AXIS_PROPS} />
                      <YAxis {...AXIS_PROPS} width={40} />
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
                  <div className="flex h-[300px] flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
                    <ChartContainer config={pieChartConfig} className="h-[250px] w-[250px]">
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
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                    <div className="space-y-3">
                      {pieData.map((entry, i) => (
                        <div key={entry.name} className="flex items-center gap-2 text-sm">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span className="text-muted-foreground">{entry.name}</span>
                          <span className="font-semibold"><AnimatedNumber value={entry.value} /></span>
                        </div>
                      ))}
                      {d?.guestVsRegistered && (
                        <div className="border-t pt-1 text-xs text-muted-foreground">
                          Guest ratio: {((d.guestVsRegistered.guestRatio ?? 0) * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Power Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Power Users</CardTitle>
              <CardDescription>Top 20 users by job count over the last {days} days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-xs font-medium uppercase tracking-wide text-muted-foreground">#</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">User ID</TableHead>
                      <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Job Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-12" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-xs font-medium uppercase tracking-wide text-muted-foreground">#</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">User ID</TableHead>
                      <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Job Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(d?.powerUsers ?? []).slice(0, 20).map(
                      (user: { userId: string; jobCount: number }, index: number) => (
                        <TableRow key={index} className="transition-colors hover:bg-muted/50">
                          <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
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
        </>
      )}
    </div>
  );
};

export default EngagementPage;
