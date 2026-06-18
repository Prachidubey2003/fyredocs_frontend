import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/admin/KpiCard';
import { ChartCard } from '@/components/admin/ChartCard';
import { MultiLineChart } from '@/components/admin/charts/MultiLineChart';
import { DonutChart } from '@/components/admin/charts/DonutChart';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { CHART_COLORS, formatNumber, formatCompact } from '@/components/admin/chartTheme';
import { formatBytes } from '@/lib/userMetrics';
import { useAuth } from '@/auth/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import type { AdminDashboardData, UserDashboardData } from '@/lib/dashboardApi';

/**
 * Unified, role-aware landing page. Every authenticated user lands here after
 * login; the server (GET /api/dashboard) returns either the admin or the user
 * payload based on role, and this page renders the matching view. Deeper pages
 * (/admin/* and /app/*) remain reachable from each view.
 */
const Dashboard = () => {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useDashboard();
  const firstName = (user?.fullName || user?.email || 'there').split(/[\s@]/)[0];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Helmet>
        <title>Dashboard — Fyredocs</title>
      </Helmet>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName} 👋</h1>
        <p className="mt-1 text-body-sm text-muted-foreground">
          Your overview at a glance.
        </p>
      </div>

      {isError ? (
        <MetricsErrorState title="Could not load your dashboard" onRetry={() => refetch()} />
      ) : data?.role === 'admin' ? (
        <AdminView data={data} isLoading={isLoading} />
      ) : (
        <UserView data={data?.role === 'user' ? data : undefined} isLoading={isLoading} />
      )}
    </div>
  );
};

function AdminView({ data, isLoading }: { data?: AdminDashboardData; isLoading: boolean }) {
  const t = data?.today;
  const kpis = [
    { label: 'Total Users', value: formatNumber(data?.totalUsers ?? 0), to: '/admin/growth' as const },
    { label: 'Signups Today', value: formatNumber(t?.signups ?? 0), to: '/admin/business' as const },
    { label: 'Logins Today', value: formatNumber(t?.logins ?? 0) },
    { label: 'Active Today (DAU)', value: formatNumber(t?.dau ?? 0), to: '/admin/growth' as const },
    { label: 'Guest Sessions', value: formatNumber(t?.guestSessions ?? 0) },
    { label: 'Jobs Created', value: formatNumber(t?.jobsCreated ?? 0) },
    { label: 'Jobs Completed', value: formatNumber(t?.jobsCompleted ?? 0), status: 'healthy' as const },
    {
      label: 'Jobs Failed',
      value: formatNumber(t?.jobsFailed ?? 0),
      invertGood: true,
      status: (t?.jobsFailed ?? 0) > 0 ? ('warning' as const) : ('healthy' as const),
      to: '/admin/reliability' as const,
    },
  ];

  const toolSegments = (data?.toolUsage ?? []).map((row) => ({ name: row.toolType, value: row.count }));
  const planSegments = (data?.planDistribution ?? []).map((row) => ({ name: row.planName, value: row.users }));

  return (
    <>
      <div className="grid auto-rows-fr grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} isLoading={isLoading} />
        ))}
      </div>

      <div className="flex items-center justify-end">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/business">
            Full analytics <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Tool usage"
          description={`Jobs by tool — last ${data?.period.days ?? 30} days`}
          isLoading={isLoading}
          awaitingData={toolSegments.length === 0}
          awaitingMessage="No tool usage yet."
        >
          <DonutChart data={toolSegments} centerSubLabel="Jobs" />
        </ChartCard>

        <ChartCard
          title="Plan distribution"
          description={`Users by plan — last ${data?.period.days ?? 30} days`}
          isLoading={isLoading}
          awaitingData={planSegments.length === 0}
          awaitingMessage="No plan data yet."
        >
          <DonutChart data={planSegments} centerSubLabel="Users" />
        </ChartCard>
      </div>
    </>
  );
}

function UserView({ data, isLoading }: { data?: UserDashboardData; isLoading: boolean }) {
  const jobs = data?.jobs;
  const kpis = [
    { label: 'Total Jobs', value: formatNumber(jobs?.total ?? 0), to: '/app/documents' as const },
    { label: 'Completed', value: formatNumber(jobs?.completed ?? 0), status: 'healthy' as const, to: '/app/documents' as const },
    {
      label: 'Failed',
      value: formatNumber(jobs?.failed ?? 0),
      invertGood: true,
      status: (jobs?.failed ?? 0) > 0 ? ('warning' as const) : ('healthy' as const),
    },
    { label: 'Data Processed', value: formatBytes(data?.bytesProcessed ?? 0) },
    { label: 'Plan', value: data?.plan ? data.plan : '—' },
  ];

  const activity = (data?.recentActivity ?? []).map((row) => ({ date: row.date, count: row.count }));
  const toolSegments = (data?.toolUsage ?? []).map((row) => ({ name: row.toolType, value: row.count }));

  return (
    <>
      <div className="grid auto-rows-fr grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} isLoading={isLoading} />
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Your activity</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/app/documents">
              View documents <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ChartCard
            className="lg:col-span-2"
            title="Recent activity"
            description={`Events per day — last ${data?.period.days ?? 30} days`}
            isLoading={isLoading}
            awaitingData={activity.length === 0}
            awaitingMessage="No activity yet. Run a tool to get started."
            exportData={{ filename: 'recent-activity', rows: activity }}
          >
            <MultiLineChart
              data={activity}
              xKey="date"
              series={[{ key: 'count', label: 'Activity', color: CHART_COLORS[1] }]}
              leftTickFormatter={formatCompact}
              valueFormatter={(v) => formatNumber(v)}
            />
          </ChartCard>

          <ChartCard
            title="Tools you use"
            description="Jobs by tool"
            isLoading={isLoading}
            awaitingData={toolSegments.length === 0}
            awaitingMessage="No tool usage yet."
          >
            <DonutChart data={toolSegments} centerSubLabel="Jobs" />
          </ChartCard>
        </div>
      </section>

      {data?.memberSince && (
        <Card>
          <CardHeader className="p-4 pb-2">
            <h3 className="text-sm font-medium">Member since</h3>
          </CardHeader>
          <CardContent className="p-4 pt-2 text-body-sm text-muted-foreground">
            {new Date(data.memberSince).toLocaleDateString()}
          </CardContent>
        </Card>
      )}
    </>
  );
}

export default Dashboard;
