import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { SummaryCard } from '@/components/admin/SummaryCard';
import { ProgressRing } from '@/components/admin/ProgressRing';
import { AnimatedNumber } from '@/components/admin/AnimatedNumber';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import {
  useOverview,
  useBusiness,
  useGrowth,
  useEngagement,
  useReliability,
  useSystem,
  useServerPerformance,
  useApiPerformance,
} from '@/hooks/useAdminMetrics';
import {
  DollarSign,
  TrendingUp,
  MousePointerClick,
  ShieldCheck,
  Activity,
  Server,
  Gauge,
} from 'lucide-react';

function QuickStats() {
  const { data, isLoading } = useOverview();
  const d = data?.data;

  const items = [
    { label: 'Signups Today', value: d?.signups, color: 'text-green-600' },
    { label: 'DAU', value: d?.dau, color: 'text-blue-600' },
    { label: 'Jobs Created', value: d?.jobsCreated, color: 'text-purple-600' },
    { label: 'Jobs Failed', value: d?.jobsFailed, color: 'text-red-600' },
    { label: 'Logins', value: d?.logins },
    { label: 'Guest Sessions', value: d?.guestSessions },
    { label: 'Jobs Completed', value: d?.jobsCompleted, color: 'text-emerald-600' },
    { label: 'Plan Limit Hits', value: d?.planLimitHits, color: 'text-orange-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {items.map((item) => (
        <Card key={item.label} className="text-center">
          <CardHeader className="px-3 pb-1 pt-3">
            <CardDescription className="text-xs">{item.label}</CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {isLoading ? (
              <Skeleton className="mx-auto h-7 w-10" />
            ) : (
              <p className={`text-2xl font-bold ${item.color ?? ''}`}><AnimatedNumber value={item.value ?? 0} /></p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Sparkline({ data, dataKey, color }: { data: { [k: string]: unknown }[]; dataKey: string; color: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.15} strokeWidth={1.5} dot={false}
          isAnimationActive animationDuration={800} animationEasing="ease-out" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function BusinessCard() {
  const { data, isLoading } = useBusiness(30);
  const d = data?.data;
  return (
    <SummaryCard
      title="Business"
      icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
      to="/admin/business"
      isLoading={isLoading}
      stats={[
        { label: 'Total Signups', value: d?.signups?.total ?? 0 },
        { label: 'Churn Rate', value: `${((d?.churn?.churnRate ?? 0) * 100).toFixed(1)}%`, color: (d?.churn?.churnRate ?? 0) > 0.1 ? 'text-red-600' : 'text-green-600' },
        { label: 'Conversion', value: `${((d?.conversionRate?.rate ?? 0) * 100).toFixed(1)}%` },
      ]}
      chart={d?.signups?.daily ? <Sparkline data={d.signups.daily} dataKey="signups" color="hsl(142, 71%, 45%)" /> : undefined}
    />
  );
}

function GrowthCard() {
  const { data, isLoading } = useGrowth(30);
  const d = data?.data;
  return (
    <SummaryCard
      title="Growth"
      icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
      to="/admin/growth"
      isLoading={isLoading}
      stats={[
        { label: 'DAU', value: d?.dau ?? 0, color: 'text-blue-600' },
        { label: 'WAU / MAU', value: `${d?.wau ?? 0} / ${d?.mau ?? 0}` },
        { label: 'Stickiness', value: `${((d?.stickiness ?? 0) * 100).toFixed(1)}%` },
      ]}
      chart={d?.dauTrend ? <Sparkline data={d.dauTrend} dataKey="dau" color="hsl(217, 91%, 60%)" /> : undefined}
    />
  );
}

function EngagementCard() {
  const { data, isLoading } = useEngagement(30);
  const d = data?.data;
  return (
    <SummaryCard
      title="Engagement"
      icon={<MousePointerClick className="h-4 w-4 text-purple-600" />}
      to="/admin/engagement"
      isLoading={isLoading}
      stats={[
        { label: 'Avg Jobs/User', value: (d?.jobsPerUser?.average ?? 0).toFixed(1) },
        { label: 'Guest Ratio', value: `${((d?.guestVsRegistered?.guestRatio ?? 0) * 100).toFixed(0)}%` },
        { label: 'Power Users', value: d?.powerUsers?.length ?? 0 },
      ]}
    />
  );
}

function ReliabilityCard() {
  const { data, isLoading } = useReliability(30);
  const d = data?.data;
  const rate = (d?.jobRate?.successRate ?? 0) * 100;
  return (
    <SummaryCard
      title="Reliability"
      icon={<ShieldCheck className="h-4 w-4 text-green-600" />}
      to="/admin/reliability"
      isLoading={isLoading}
      stats={[
        { label: 'Success Rate', value: `${rate.toFixed(1)}%`, color: rate >= 95 ? 'text-green-600' : rate >= 80 ? 'text-yellow-600' : 'text-red-600' },
        { label: 'P95 Latency', value: `${(d?.processingTime?.p95Seconds ?? 0).toFixed(1)}s` },
        { label: 'Failed Jobs', value: d?.jobRate?.failed ?? 0, color: 'text-red-600' },
      ]}
      chart={<ProgressRing value={rate} color={rate >= 95 ? 'hsl(142, 71%, 45%)' : rate >= 80 ? 'hsl(48, 96%, 53%)' : 'hsl(0, 84%, 60%)'} />}
    />
  );
}

function SystemCard() {
  const { data, isLoading } = useSystem();
  const d = data?.data;
  return (
    <SummaryCard
      title="System Health"
      icon={<Activity className="h-4 w-4 text-cyan-600" />}
      to="/admin/system"
      isLoading={isLoading}
      stats={[
        { label: 'Events/Hour', value: d?.eventsLastHour ?? 0 },
        { label: 'Active Now', value: d?.activeUsersNow ?? 0, color: 'text-green-600' },
        { label: 'Avg Lag', value: `${(d?.processingLag?.avgSeconds ?? 0).toFixed(2)}s` },
      ]}
      chart={d?.ingestionRate ? <Sparkline data={d.ingestionRate} dataKey="count" color="hsl(187, 92%, 41%)" /> : undefined}
    />
  );
}

function ServerPerfCard() {
  const { data, isLoading } = useServerPerformance();
  const d = data?.data;
  const cpu = d?.system?.cpu?.usagePercent ?? 0;
  const mem = d?.system?.memory?.usagePercent ?? 0;
  const disk = d?.system?.storage?.usagePercent ?? 0;

  return (
    <SummaryCard
      title="Server"
      icon={<Server className="h-4 w-4 text-orange-600" />}
      to="/admin/server-performance"
      isLoading={isLoading}
      stats={[
        { label: 'CPU', value: `${cpu.toFixed(0)}%`, color: cpu > 80 ? 'text-red-600' : '' },
        { label: 'Memory', value: `${mem.toFixed(0)}%`, color: mem > 80 ? 'text-red-600' : '' },
        { label: 'Disk', value: `${disk.toFixed(0)}%`, color: disk > 80 ? 'text-red-600' : '' },
      ]}
      chart={
        <div className="space-y-2">
          <Progress value={cpu} className="h-1.5 transition-all duration-700" />
          <Progress value={mem} className="h-1.5 transition-all duration-700" />
          <Progress value={disk} className="h-1.5 transition-all duration-700" />
        </div>
      }
    />
  );
}

function ApiPerfCard() {
  const { data, isLoading } = useApiPerformance();
  const d = data?.data;
  return (
    <SummaryCard
      title="API"
      icon={<Gauge className="h-4 w-4 text-indigo-600" />}
      to="/admin/api-performance"
      isLoading={isLoading}
      stats={[
        { label: 'Requests', value: d?.summary?.totalRequests ?? 0 },
        { label: 'Avg Latency', value: `${(d?.summary?.avgLatencyMs ?? 0).toFixed(0)}ms` },
        { label: 'Error Rate', value: `${((d?.summary?.errorRate ?? 0) * 100).toFixed(1)}%`, color: (d?.summary?.errorRate ?? 0) > 0.05 ? 'text-red-600' : 'text-green-600' },
      ]}
    />
  );
}

const AdminDashboard = () => {
  return (
    <Layout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform overview — click any card for details</p>
        </div>

        <QuickStats />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <BusinessCard />
          <GrowthCard />
          <EngagementCard />
          <ReliabilityCard />
          <SystemCard />
          <ServerPerfCard />
          <ApiPerfCard />
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
