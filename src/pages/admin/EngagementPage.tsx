import { useMemo } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { ChartCard } from '@/components/admin/ChartCard';
import { InsightsPanel } from '@/components/admin/InsightsPanel';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { MultiLineChart, type LineSeries } from '@/components/admin/charts/MultiLineChart';
import { StackedBarChart } from '@/components/admin/charts/StackedBarChart';
import { DonutChart } from '@/components/admin/charts/DonutChart';
import { Briefcase, UserCheck, UserCircle, Gauge } from 'lucide-react';
import { useEngagement, useToolUsage } from '@/hooks/useAdminMetrics';
import { useAdminTimeRange } from '@/hooks/useAdminTimeRange';
import { CHART_COLORS, SEMANTIC, formatNumber } from '@/components/admin/chartTheme';
import { pivotToolTrends, segmentUsers } from '@/lib/adminDerived';
import { computeEngagementInsights } from '@/lib/insights';

type PowerUserRow = { userId: string; jobCount: number };

const powerUserColumns: Column<PowerUserRow>[] = [
  { key: 'userId', label: 'User ID', sortable: true, truncate: 16, className: 'font-mono text-xs' },
  { key: 'jobCount', label: 'Jobs', sortable: true, align: 'right', render: (v) => (v as number).toLocaleString() },
];

const SEGMENT_COLORS = [SEMANTIC.success, CHART_COLORS[1], CHART_COLORS[3], 'hsl(var(--muted-foreground))'];

const EngagementPage = () => {
  const { days } = useAdminTimeRange();
  const { data, isLoading, isError, refetch } = useEngagement(days);
  const toolUsage = useToolUsage(days);
  const d = data;

  const insights = useMemo(() => computeEngagementInsights(d), [d]);

  const { data: activityData, tools } = useMemo(() => pivotToolTrends(d?.toolTrends, 4), [d?.toolTrends]);
  const activitySeries: LineSeries[] = tools.map((tool, i) => ({
    key: tool,
    label: tool,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const segments = useMemo(
    () => segmentUsers(d).map((s, i) => ({ ...s, color: SEGMENT_COLORS[i % SEGMENT_COLORS.length] })),
    [d],
  );

  const guestRatio = (d?.guestVsRegistered?.guestRatio ?? 0) * 100;
  const powerUsers = (d?.powerUsers ?? []) as PowerUserRow[];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader title="Engagement" description="Activity, segmentation, and feature adoption" />

      {isError ? (
        <MetricsErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard label="Avg Jobs/User" value={d?.jobsPerUser?.average != null ? d.jobsPerUser.average.toFixed(1) : undefined} icon={Briefcase} tone="brand" isLoading={isLoading} />
            <StatCard label="Guest Ratio" value={`${guestRatio.toFixed(0)}%`} icon={UserCircle} tone="default" isLoading={isLoading} />
            <StatCard label="Registered Users" value={d?.guestVsRegistered?.uniqueRegistered} icon={UserCheck} tone="success" isLoading={isLoading} />
            <StatCard label="Median Jobs/User" value={d?.jobsPerUser?.median} icon={Gauge} tone="info" isLoading={isLoading} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Tool activity"
              description={`Daily usage by top tools — last ${days} days`}
              isLoading={isLoading}
              awaitingData={activityData.length === 0}
              exportData={{ filename: 'tool-activity', rows: activityData }}
            >
              <MultiLineChart data={activityData} xKey="date" series={activitySeries} leftTickFormatter={formatNumber} valueFormatter={(v) => formatNumber(v)} />
            </ChartCard>

            <ChartCard
              title="User segmentation"
              description="By engagement level"
              isLoading={isLoading}
              awaitingData={segments.length === 0}
              exportData={{ filename: 'user-segments', rows: segments }}
            >
              <DonutChart data={segments} centerSubLabel="Users" />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Feature adoption"
              description="Completed vs failed jobs by tool"
              isLoading={toolUsage.isLoading}
              awaitingData={(toolUsage.data?.length ?? 0) === 0}
              exportData={{ filename: 'feature-adoption', rows: toolUsage.data ?? [] }}
            >
              <StackedBarChart
                data={[...(toolUsage.data ?? [])].sort((a, b) => b.count - a.count).slice(0, 10)}
                xKey="toolType"
                layout="horizontal"
                series={[
                  { key: 'completed', label: 'Completed', color: SEMANTIC.success },
                  { key: 'failed', label: 'Failed', color: SEMANTIC.danger },
                ]}
                categoryTickFormatter={(t) => t}
                valueTickFormatter={formatNumber}
              />
            </ChartCard>

            <InsightsPanel insights={insights} title="Engagement insights" isLoading={isLoading} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Power users</CardTitle>
              <CardDescription>Most active users by job count — last {days} days</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable<PowerUserRow>
                data={powerUsers}
                columns={powerUserColumns}
                isLoading={isLoading}
                searchableFields={['userId']}
                defaultSort={{ key: 'jobCount', desc: true }}
                pageSize={10}
                emptyMessage="No power-user data available"
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default EngagementPage;
