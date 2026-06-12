import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Area, AreaChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis } from 'recharts';
import { AnimatedNumber } from '@/components/admin/AnimatedNumber';
import { Progress } from '@/components/ui/progress';
import { Activity, Zap, Timer, BarChart3 } from 'lucide-react';
import { useSystem } from '@/hooks/useAdminMetrics';
import { AXIS_PROPS, CHART_COLORS, GRID_PROPS } from '@/components/admin/chartTheme';

const ingestionConfig = {
  count: { label: 'Events', color: CHART_COLORS[2] },
} satisfies ChartConfig;

/** Token class for processing lag (seconds, lower is better). */
function lagToneClass(seconds: number): string {
  if (seconds > 5) return 'text-destructive';
  if (seconds > 1) return 'text-warning';
  return 'text-success';
}

/** Progress indicator class for processing lag (seconds, lower is better). */
function lagBarClass(seconds: number): string {
  if (seconds > 5) return '[&>div]:bg-destructive';
  if (seconds > 1) return '[&>div]:bg-warning';
  return '[&>div]:bg-success';
}

const SystemPage = () => {
  const { data, isLoading, isError, refetch } = useSystem();
  const d = data;

  const avgLag = d?.processingLag?.avgSeconds ?? 0;
  const lagColor = lagToneClass(avgLag);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="System Health"
        description="Event ingestion, processing lag, and live activity"
      />

      {isError ? (
        <MetricsErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard
              label="Active Users Now"
              value={d?.activeUsersNow}
              icon={Activity}
              tone="success"
              color="text-success"
              isLoading={isLoading}
            />
            <StatCard
              label="Events/Hour"
              value={d?.eventsLastHour}
              icon={Zap}
              tone="info"
              isLoading={isLoading}
            />
            <StatCard
              label="Events/24h"
              value={d?.eventsLast24h}
              icon={Zap}
              tone="info"
              isLoading={isLoading}
            />
            <StatCard
              label="Avg Lag"
              value={`${avgLag.toFixed(2)}s`}
              icon={Timer}
              tone="warning"
              color={lagColor}
              isLoading={isLoading}
            />
            <StatCard
              label="Total Events"
              value={d?.totalEvents?.toLocaleString()}
              icon={BarChart3}
              tone="default"
              isLoading={isLoading}
            />
          </div>

          {/* Processing Lag Detail */}
          <Card>
            <CardHeader>
              <CardTitle>Processing Lag</CardTitle>
              <CardDescription>Average time between job creation and processing start</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-7 w-20" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-6" />
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Avg Lag</span>
                    <span className={`text-2xl font-bold ${lagColor}`}>
                      <AnimatedNumber value={avgLag} decimals={2} suffix="s" />
                    </span>
                  </div>
                  <Progress
                    value={Math.min((avgLag / 10) * 100, 100)}
                    className={`h-3 transition-all duration-700 ${lagBarClass(avgLag)}`}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>0s</span>
                    <span>1s (good)</span>
                    <span>5s (warn)</span>
                    <span>10s+</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ingestion Rate</CardTitle>
              <CardDescription>Events per hour — last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                <ChartContainer config={ingestionConfig} className="h-[300px] w-full">
                  <AreaChart data={d?.ingestionRate ?? []} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid {...GRID_PROPS} vertical={false} />
                    <XAxis dataKey="hour" {...AXIS_PROPS} tickMargin={8}
                      tickFormatter={(v: string) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                    <YAxis {...AXIS_PROPS} width={40} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area dataKey="count" type="monotone" fill="var(--color-count)" fillOpacity={0.2} stroke="var(--color-count)" strokeWidth={2}
                      isAnimationActive animationDuration={800} animationEasing="ease-out" />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Events by Type</CardTitle>
              <CardDescription>Distribution in the last hour</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              {isLoading ? (
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
                  <Skeleton className="h-[200px] w-[200px] rounded-full" />
                  <div className="space-y-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-10" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
                  <PieChart width={250} height={250}>
                    <Pie data={d?.eventsByType ?? []} dataKey="count" nameKey="eventType" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2}
                      isAnimationActive animationDuration={800} animationEasing="ease-out">
                      {(d?.eventsByType ?? []).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div className="space-y-2">
                    {(d?.eventsByType ?? []).map((row, i) => (
                      <div key={row.eventType} className="flex items-center gap-2 text-sm">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="text-muted-foreground">{row.eventType}</span>
                        <span className="font-semibold"><AnimatedNumber value={row.count} /></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default SystemPage;
