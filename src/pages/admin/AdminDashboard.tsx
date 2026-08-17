import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SummaryCard } from '@/components/admin/SummaryCard';
import { ProgressRing } from '@/components/admin/ProgressRing';
import { StatCard } from '@/components/admin/StatCard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
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
  useAdminActivity,
} from '@/hooks/useAdminMetrics';
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
  History,
} from 'lucide-react';

function QuickStats() {
  const { data, isLoading } = useOverview();
  const d = data;

  const items = [
    { label: 'Signups Today', value: d?.signups, color: 'text-green-600', bg: 'bg-green-500/10', icon: UserPlus },
    { label: 'DAU', value: d?.dau, color: 'text-blue-600', bg: 'bg-blue-500/10', icon: Users },
    { label: 'Jobs Created', value: d?.jobsCreated, color: 'text-purple-600', bg: 'bg-purple-500/10', icon: Briefcase },
    { label: 'Jobs Failed', value: d?.jobsFailed, color: 'text-red-600', bg: 'bg-red-500/10', icon: AlertTriangle },
    { label: 'Logins', value: d?.logins, color: 'text-sky-600', bg: 'bg-sky-500/10', icon: LogIn },
    { label: 'Guest Sessions', value: d?.guestSessions, color: 'text-slate-600', bg: 'bg-slate-500/10', icon: UserCircle },
    { label: 'Jobs Completed', value: d?.jobsCompleted, color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
    { label: 'Plan Limit Hits', value: d?.planLimitHits, color: 'text-orange-600', bg: 'bg-orange-500/10', icon: Zap },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
      {items.map((item) => (
        <StatCard
          key={item.label}
          label={item.label}
          value={item.value}
          icon={item.icon}
          iconColor={item.color}
          iconBg={item.bg}
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
          <span className="text-[9px] text-muted-foreground leading-none">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function BusinessCard() {
  const { data, isLoading } = useBusiness(30);
  const d = data;
  const signups = d?.signups?.total ?? 0;
  const churn = (d?.churn?.churnRate ?? 0) * 100;
  const conversion = (d?.conversionRate?.rate ?? 0) * 100;
  return (
    <SummaryCard
      title="Business"
      icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
      to="/admin/business"
      isLoading={isLoading}
      stats={[
        { label: 'Total Signups', value: signups },
        { label: 'Churn Rate', value: `${churn.toFixed(1)}%`, color: churn > 10 ? 'text-red-600' : 'text-green-600' },
        { label: 'Conversion', value: `${conversion.toFixed(1)}%` },
      ]}
      chart={
        <MiniRings items={[
          { label: 'Signups', value: Math.min((signups / 100) * 100, 100), color: 'hsl(142, 71%, 45%)', displayLabel: String(signups) },
          { label: 'Churn', value: churn, color: churn > 10 ? 'hsl(0, 84%, 60%)' : 'hsl(142, 71%, 45%)' },
          { label: 'Conv.', value: conversion, color: 'hsl(217, 91%, 60%)' },
        ]} />
      }
    />
  );
}

function GrowthCard() {
  const { data, isLoading } = useGrowth(30);
  const d = data;
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
      chart={
        <div className="w-full space-y-2">
          {[
            { label: 'DAU', value: d?.dau ?? 0, color: 'bg-blue-500' },
            { label: 'WAU', value: d?.wau ?? 0, color: 'bg-cyan-500' },
            { label: 'MAU', value: d?.mau ?? 0, color: 'bg-indigo-500' },
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

function EngagementCard() {
  const { data, isLoading } = useEngagement(30);
  const d = data;
  const guest = d?.guestVsRegistered?.guestEvents ?? 0;
  const registered = d?.guestVsRegistered?.registeredEvents ?? 0;
  const power = d?.powerUsers?.length ?? 0;
  const pieData = [
    { name: 'Guest', value: guest || 1 },
    { name: 'Registered', value: registered || 1 },
    { name: 'Power', value: power || 1 },
  ];
  const COLORS = ['hsl(271, 91%, 65%)', 'hsl(271, 71%, 50%)', 'hsl(271, 50%, 35%)'];
  return (
    <SummaryCard
      title="Engagement"
      icon={<MousePointerClick className="h-4 w-4 text-purple-600" />}
      to="/admin/engagement"
      isLoading={isLoading}
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
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      }
    />
  );
}

function ReliabilityCard() {
  const { data, isLoading } = useReliability(30);
  const d = data;
  const total = d?.jobRate?.total ?? 0;
  const failed = d?.jobRate?.failed ?? 0;
  const rate = (d?.jobRate?.successRate ?? 0) * 100;
  const p95 = d?.processingTime?.p95Seconds ?? 0;
  return (
    <SummaryCard
      title="Reliability"
      icon={<ShieldCheck className="h-4 w-4 text-green-600" />}
      to="/admin/reliability"
      isLoading={isLoading}
      stats={[
        { label: 'Success Rate', value: `${rate.toFixed(1)}%`, color: rate >= 95 ? 'text-green-600' : rate >= 80 ? 'text-yellow-600' : 'text-red-600' },
        { label: 'P95 Latency', value: `${p95.toFixed(1)}s` },
        { label: 'Failed Jobs', value: failed, color: 'text-red-600' },
      ]}
      chart={
        <MiniRings items={[
          { label: 'Success', value: rate, color: rate >= 95 ? 'hsl(142, 71%, 45%)' : rate >= 80 ? 'hsl(48, 96%, 53%)' : 'hsl(0, 84%, 60%)' },
          { label: 'P95', value: Math.max(100 - (p95 / 10) * 100, 0), color: p95 > 5 ? 'hsl(0, 84%, 60%)' : 'hsl(142, 71%, 45%)', displayLabel: `${p95.toFixed(1)}s` },
          { label: 'Failed', value: total > 0 ? (failed / total) * 100 : 0, color: failed > 0 ? 'hsl(0, 84%, 60%)' : 'hsl(142, 71%, 45%)', displayLabel: String(failed) },
        ]} />
      }
    />
  );
}

function SystemCard() {
  const { data, isLoading } = useSystem();
  const d = data;
  const events = d?.eventsLastHour ?? 0;
  const active = d?.activeUsersNow ?? 0;
  const lag = d?.processingLag?.avgSeconds ?? 0;
  return (
    <SummaryCard
      title="System Health"
      icon={<Activity className="h-4 w-4 text-cyan-600" />}
      to="/admin/system"
      isLoading={isLoading}
      stats={[
        { label: 'Events/Hour', value: events },
        { label: 'Active Now', value: active, color: 'text-green-600' },
        { label: 'Avg Lag', value: `${lag.toFixed(2)}s` },
      ]}
      chart={
        <div className="w-full space-y-2">
          {[
            { label: 'Events/h', value: Math.min((events / 1000) * 100, 100), display: String(events), color: 'bg-cyan-500' },
            { label: 'Active', value: Math.min((active / 100) * 100, 100), display: String(active), color: 'bg-green-500' },
            { label: 'Lag', value: Math.max(100 - lag * 10, 0), display: `${lag.toFixed(2)}s`, color: lag > 5 ? 'bg-red-500' : 'bg-yellow-500' },
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
  const { data, isLoading } = useServerPerformance();
  const d = data;
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
        <div className="w-full space-y-2">
          {[
            { label: 'CPU', value: cpu, color: cpu > 80 ? 'bg-red-500' : 'bg-blue-500' },
            { label: 'Mem', value: mem, color: mem > 80 ? 'bg-red-500' : 'bg-emerald-500' },
            { label: 'Disk', value: disk, color: disk > 80 ? 'bg-red-500' : 'bg-orange-500' },
          ].map((item) => (
            <div key={item.label} className="space-y-0.5">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{item.label}</span>
                <span>{item.value.toFixed(0)}%</span>
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

function ApiPerfCard() {
  const { data: resp, isLoading } = useApiPerformance();
  const d = resp?.data;
  const requests = d?.summary?.totalRequests ?? 0;
  const latency = d?.summary?.avgLatencyMs ?? 0;
  const errorRate = (d?.summary?.errorRate ?? 0) * 100;
  return (
    <SummaryCard
      title="API"
      icon={<Gauge className="h-4 w-4 text-indigo-600" />}
      to="/admin/api-performance"
      isLoading={isLoading}
      stats={[
        { label: 'Requests', value: requests },
        { label: 'Avg Latency', value: `${latency.toFixed(0)}ms` },
        { label: 'Error Rate', value: `${errorRate.toFixed(1)}%`, color: errorRate > 5 ? 'text-red-600' : 'text-green-600' },
      ]}
      chart={
        <MiniRings items={[
          { label: 'Reqs', value: Math.min((requests / 10000) * 100, 100), color: 'hsl(239, 84%, 67%)', displayLabel: requests > 999 ? `${(requests / 1000).toFixed(1)}k` : String(requests) },
          { label: 'Latency', value: Math.max(100 - (latency / 1000) * 100, 0), color: latency > 500 ? 'hsl(38, 92%, 50%)' : 'hsl(142, 71%, 45%)', displayLabel: `${latency.toFixed(0)}ms` },
          { label: 'Errors', value: errorRate, color: errorRate > 5 ? 'hsl(0, 84%, 60%)' : 'hsl(142, 71%, 45%)' },
        ]} />
      }
    />
  );
}

function ActivityAuditCard() {
  const { data: resp, isLoading } = useAdminActivity({ limit: 1 });
  const total = resp?.meta?.total ?? 0;
  const { data: failedResp } = useAdminActivity({ limit: 1, status: 'failed' });
  const failed = failedResp?.meta?.total ?? 0;
  const failureRate = total > 0 ? (failed / total) * 100 : 0;
  return (
    <SummaryCard
      title="Activity Audit"
      icon={<History className="h-4 w-4 text-cyan-600" />}
      to="/admin/activity"
      isLoading={isLoading}
      stats={[
        { label: 'Total Events', value: total },
        { label: 'Failed', value: failed, color: failed > 0 ? 'text-red-600' : 'text-green-600' },
        { label: 'Failure Rate', value: `${failureRate.toFixed(1)}%`, color: failureRate > 5 ? 'text-red-600' : 'text-green-600' },
      ]}
    />
  );
}

const AdminDashboard = () => {
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(() => {
    queryClient.resetQueries({ queryKey: ['admin'] });
  }, [queryClient]);

  return (
    <>
      <div className="space-y-6 px-4 py-8">
        <AdminPageHeader
          title="Admin Dashboard"
          description="Platform overview — click any card for details"
          onRefresh={handleRefresh}
          backTo={null}
        />

        <QuickStats />

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <BusinessCard />
          <GrowthCard />
          <EngagementCard />
          <ReliabilityCard />
          <SystemCard />
          <ServerPerfCard />
          <ApiPerfCard />
          <ActivityAuditCard />
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
