import { Layout } from '@/components/layout/Layout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Area, AreaChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useSystem } from '@/hooks/useAdminMetrics';

const ingestionConfig = {
  count: { label: 'Events', color: 'hsl(187, 92%, 41%)' },
} satisfies ChartConfig;

const COLORS = [
  'hsl(217, 91%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(0, 84%, 60%)',
  'hsl(48, 96%, 53%)', 'hsl(262, 83%, 58%)', 'hsl(24, 95%, 53%)',
];

const SystemPage = () => {
  const { data, isLoading } = useSystem();
  const d = data?.data;

  const lagColor = (d?.processingLag?.avgSeconds ?? 0) > 5 ? 'text-red-600' :
    (d?.processingLag?.avgSeconds ?? 0) > 1 ? 'text-yellow-600' : 'text-green-600';

  return (
    <Layout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <AdminPageHeader title="System Health" description="Event ingestion, processing lag, and live activity" />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Active Users Now" value={d?.activeUsersNow} color="text-green-600" isLoading={isLoading} />
          <StatCard label="Events/Hour" value={d?.eventsLastHour} color="text-cyan-600" isLoading={isLoading} />
          <StatCard label="Events/24h" value={d?.eventsLast24h} isLoading={isLoading} />
          <StatCard label="Avg Lag" value={`${(d?.processingLag?.avgSeconds ?? 0).toFixed(2)}s`} color={lagColor} isLoading={isLoading} />
          <StatCard label="Total Events" value={d?.totalEvents?.toLocaleString()} isLoading={isLoading} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ingestion Rate</CardTitle>
            <CardDescription>Events per hour — last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
              <ChartContainer config={ingestionConfig} className="h-[300px] w-full">
                <AreaChart data={d?.ingestionRate ?? []} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8}
                    tickFormatter={(v: string) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area dataKey="count" type="monotone" fill="var(--color-count)" fillOpacity={0.2} stroke="var(--color-count)" strokeWidth={2} />
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
            {isLoading ? <Skeleton className="h-[250px] w-[250px] rounded-full" /> : (
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
                <PieChart width={250} height={250}>
                  <Pie data={d?.eventsByType ?? []} dataKey="count" nameKey="eventType" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2}>
                    {(d?.eventsByType ?? []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="space-y-2">
                  {(d?.eventsByType ?? []).map((row, i) => (
                    <div key={row.eventType} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{row.eventType}</span>
                      <span className="font-semibold">{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SystemPage;
