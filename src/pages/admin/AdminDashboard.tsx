import { SummaryCard } from '@/components/admin/SummaryCard';
import { ProgressRing } from '@/components/admin/ProgressRing';
import { StatCard } from '@/components/admin/StatCard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
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
import { useAdminTimeRange } from '@/hooks/useAdminTimeRange';
import {
  CHART_COLORS,
  SEMANTIC,
  rateToneClass,
  rateToneColor,
  usageToneColor,
} from '@/components/admin/chartTheme';
import {
  DollarSign,
  TrendingUp,
  MousePointerClick,
  ShieldCheck,
  Activity,
  Server,
  Gauge,
  UserPlus,
  Users,
  Briefcase,
  AlertTriangle,
  LogIn,
  UserCircle,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import type { StatTone } from '@/components/admin/StatCard';

/** Deep-link to a time-range section, preserving the current `?days=`. */
function sectionLink(path: string, days: number): string {
  return `${path}?days=${days}`;
}

function QuickStats() {
  const { data, isLoading, isError, refetch } = useOverview();
  const d = data;

  if (isError) {
    return <MetricsErrorState compact title="Failed to load today's overview" onRetry={() => refetch()} />;
  }

  const items: { label: string; value: number | undefined; tone: StatTone; color?: string; icon: typeof UserPlus }[] = [
    { label: 'Signups Today', value: d?.signups, tone: 'success', color: 'text-success', icon: UserPlus },
    { label: 'DAU', value: d?.dau, tone: 'info', color: 'text-info', icon: Users },
    { label: 'Jobs Created', value: d?.jobsCreated, tone: 'brand', icon: Briefcase },
    { label: 'Jobs Failed', value: d?.jobsFailed, tone: 'destructive', color: 'text-destructive', icon: AlertTriangle },
    { label: 'Logins', value: d?.logins, tone: 'info', icon: LogIn },
    { label: 'Guest Sessions', value: d?.guestSessions, tone: 'default', icon: UserCircle },
    { label: 'Jobs Completed', value: d?.jobsCompleted, tone: 'success', color: 'text-success', icon: CheckCircle2 },
    { label: 'Plan Limit Hits', value: d?.planLimitHits, tone: 'warning', color: 'text-warning', icon: Zap },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      {items.map((item) => (
        <StatCard
          key={item.label}
          label={item.label}
          value={item.value}
          icon={item.icon}
          tone={item.tone}
          color={item.color}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}

function MiniRings({ items }: { items: { label: string; value: number; color: string; displayLabel?: string }[] }) {
  return (
    <div className="flex items-center justify-around gap-2">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-1">
          <ProgressRing size={56} strokeWidth={5} value={item.value} color={item.color} label={item.displayLabel} />
          <span className="text-[9px] leading-none text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function BusinessCard({ days }: { days: number }) {
  const { data, isLoading, isError, refetch } = useBusiness(days);
  const d = data;
  const signups = d?.signups?.total ?? 0;
  const churn = (d?.churn?.churnRate ?? 0) * 100;
  const conversion = (d?.conversionRate?.rate ?? 0) * 100;
  return (
    <SummaryCard
      title="Business"
      icon={<DollarSign className="h-4 w-4 text-success" />}
      to={sectionLink('/admin/business', days)}
      isLoading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      stats={[
        { label: 'Total Signups', value: signups },
        { label: 'Churn Rate', value: `${churn.toFixed(1)}%`, color: churn > 10 ? 'text-destructive' : 'text-success' },
        { label: 'Conversion', value: `${conversion.toFixed(1)}%` },
      ]}
      chart={
        <MiniRings items={[
          { label: 'Signups', value: Math.min((signups / 100) * 100, 100), color: SEMANTIC.success, displayLabel: String(signups) },
          { label: 'Churn', value: churn, color: churn > 10 ? SEMANTIC.danger : SEMANTIC.success },
          { label: 'Conv.', value: conversion, color: CHART_COLORS[1] },
        ]} />
      }
    />
  );
}

function GrowthCard({ days }: { days: number }) {
  const { data, isLoading, isError, refetch } = useGrowth(days);
  const d = data;
  return (
    <SummaryCard
      title="Growth"
      icon={<TrendingUp className="h-4 w-4 text-info" />}
      to={sectionLink('/admin/growth', days)}
      isLoading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      stats={[
        { label: 'DAU', value: d?.dau ?? 0, color: 'text-info' },
        { label: 'WAU / MAU', value: `${d?.wau ?? 0} / ${d?.mau ?? 0}` },
        { label: 'Stickiness', value: `${((d?.stickiness ?? 0) * 100).toFixed(1)}%` },
      ]}
      chart={
        <div className="w-full space-y-2">
          {[
            { label: 'DAU', value: d?.dau ?? 0, color: 'bg-chart-1' },
            { label: 'WAU', value: d?.wau ?? 0, color: 'bg-chart-2' },
            { label: 'MAU', value: d?.mau ?? 0, color: 'bg-chart-3' },
          ].map((item) => {
            const max = Math.max(d?.mau ?? 1, 1);
            return (
              <div key={item.label} className="space-y-0.5">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-700`}
                    style={{ width: `${(item.value / max) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      }
    />
  );
}

function EngagementCard({ days }: { days: number }) {
  const { data, isLoading, isError, refetch } = useEngagement(days);
  const d = data;
  const guest = d?.guestVsRegistered?.guestEvents ?? 0;
  const registered = d?.guestVsRegistered?.registeredEvents ?? 0;
  const power = d?.powerUsers?.length ?? 0;
  const pieData = [
    { name: 'Guest', value: guest || 1 },
    { name: 'Registered', value: registered || 1 },
    { name: 'Power', value: power || 1 },
  ];
  const pieColors = [CHART_COLORS[3], CHART_COLORS[4], CHART_COLORS[5]];
  return (
    <SummaryCard
      title="Engagement"
      icon={<MousePointerClick className="h-4 w-4 text-primary" />}
      to={sectionLink('/admin/engagement', days)}
      isLoading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      stats={[
        { label: 'Avg Jobs/User', value: (d?.jobsPerUser?.average ?? 0).toFixed(1) },
        { label: 'Guest Ratio', value: `${((d?.guestVsRegistered?.guestRatio ?? 0) * 100).toFixed(0)}%` },
        { label: 'Power Users', value: power },
      ]}
      chart={
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={20} outerRadius={40} strokeWidth={0} animationDuration={800}>
              {pieData.map((_, i) => (
                <Cell key={i} fill={pieColors[i]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      }
    />
  );
}

function ReliabilityCard({ days }: { days: number }) {
  const { data, isLoading, isError, refetch } = useReliability(days);
  const d = data;
  const total = d?.jobRate?.total ?? 0;
  const failed = d?.jobRate?.failed ?? 0;
  const rate = (d?.jobRate?.successRate ?? 0) * 100;
  const p95 = d?.processingTime?.p95Seconds ?? 0;
  return (
    <SummaryCard
      title="Reliability"
      icon={<ShieldCheck className="h-4 w-4 text-success" />}
      to={sectionLink('/admin/reliability', days)}
      isLoading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      stats={[
        { label: 'Success Rate', value: `${rate.toFixed(1)}%`, color: rateToneClass(rate) },
        { label: 'P95 Latency', value: `${p95.toFixed(1)}s` },
        { label: 'Failed Jobs', value: failed, color: 'text-destructive' },
      ]}
      chart={
        <MiniRings items={[
          { label: 'Success', value: rate, color: rateToneColor(rate) },
          { label: 'P95', value: Math.max(100 - (p95 / 10) * 100, 0), color: p95 > 5 ? SEMANTIC.danger : SEMANTIC.success, displayLabel: `${p95.toFixed(1)}s` },
          { label: 'Failed', value: total > 0 ? (failed / total) * 100 : 0, color: failed > 0 ? SEMANTIC.danger : SEMANTIC.success, displayLabel: String(failed) },
        ]} />
      }
    />
  );
}

function SystemCard() {
  const { data, isLoading, isError, refetch } = useSystem();
  const d = data;
  const events = d?.eventsLastHour ?? 0;
  const active = d?.activeUsersNow ?? 0;
  const lag = d?.processingLag?.avgSeconds ?? 0;
  return (
    <SummaryCard
      title="System Health"
      icon={<Activity className="h-4 w-4 text-info" />}
      to="/admin/system"
      isLoading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      stats={[
        { label: 'Events/Hour', value: events },
        { label: 'Active Now', value: active, color: 'text-success' },
        { label: 'Avg Lag', value: `${lag.toFixed(2)}s` },
      ]}
      chart={
        <div className="w-full space-y-2">
          {[
            { label: 'Events/h', value: Math.min((events / 1000) * 100, 100), display: String(events), color: 'bg-chart-2' },
            { label: 'Active', value: Math.min((active / 100) * 100, 100), display: String(active), color: 'bg-success' },
            { label: 'Lag', value: Math.max(100 - lag * 10, 0), display: `${lag.toFixed(2)}s`, color: lag > 5 ? 'bg-destructive' : 'bg-warning' },
          ].map((item) => (
            <div key={item.label} className="space-y-0.5">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{item.label}</span>
                <span>{item.display}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full ${item.color} transition-all duration-700`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      }
    />
  );
}

function ServerPerfCard() {
  const { data, isLoading, isError, refetch } = useServerPerformance();
  const d = data;
  const cpu = d?.system?.cpu?.usagePercent ?? 0;
  const mem = d?.system?.memory?.usagePercent ?? 0;
  const disk = d?.system?.storage?.usagePercent ?? 0;

  return (
    <SummaryCard
      title="Server"
      icon={<Server className="h-4 w-4 text-warning" />}
      to="/admin/server-performance"
      isLoading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      stats={[
        { label: 'CPU', value: `${cpu.toFixed(0)}%`, color: cpu > 80 ? 'text-destructive' : '' },
        { label: 'Memory', value: `${mem.toFixed(0)}%`, color: mem > 80 ? 'text-destructive' : '' },
        { label: 'Disk', value: `${disk.toFixed(0)}%`, color: disk > 80 ? 'text-destructive' : '' },
      ]}
      chart={
        <div className="w-full space-y-2">
          {[
            { label: 'CPU', value: cpu },
            { label: 'Mem', value: mem },
            { label: 'Disk', value: disk },
          ].map((item) => (
            <div key={item.label} className="space-y-0.5">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{item.label}</span>
                <span>{item.value.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${item.value}%`, backgroundColor: usageToneColor(item.value) }}
                />
              </div>
            </div>
          ))}
        </div>
      }
    />
  );
}

function ApiPerfCard() {
  const { data: resp, isLoading, isError, refetch } = useApiPerformance();
  const d = resp?.data;
  const requests = d?.summary?.totalRequests ?? 0;
  const latency = d?.summary?.avgLatencyMs ?? 0;
  const errorRate = (d?.summary?.errorRate ?? 0) * 100;
  return (
    <SummaryCard
      title="API"
      icon={<Gauge className="h-4 w-4 text-primary" />}
      to="/admin/api-performance"
      isLoading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      stats={[
        { label: 'Requests', value: requests },
        { label: 'Avg Latency', value: `${latency.toFixed(0)}ms` },
        { label: 'Error Rate', value: `${errorRate.toFixed(1)}%`, color: errorRate > 5 ? 'text-destructive' : 'text-success' },
      ]}
      chart={
        <MiniRings items={[
          { label: 'Reqs', value: Math.min((requests / 10000) * 100, 100), color: CHART_COLORS[0], displayLabel: requests > 999 ? `${(requests / 1000).toFixed(1)}k` : String(requests) },
          { label: 'Latency', value: Math.max(100 - (latency / 1000) * 100, 0), color: latency > 500 ? SEMANTIC.warning : SEMANTIC.success, displayLabel: `${latency.toFixed(0)}ms` },
          { label: 'Errors', value: errorRate, color: errorRate > 5 ? SEMANTIC.danger : SEMANTIC.success },
        ]} />
      }
    />
  );
}

const AdminDashboard = () => {
  const { days } = useAdminTimeRange();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader
        title="Admin Dashboard"
        description="Platform overview — click any card for details"
      />

      <QuickStats />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <BusinessCard days={days} />
        <GrowthCard days={days} />
        <EngagementCard days={days} />
        <ReliabilityCard days={days} />
        <SystemCard />
        <ServerPerfCard />
        <ApiPerfCard />
      </div>
    </div>
  );
};

export default AdminDashboard;
