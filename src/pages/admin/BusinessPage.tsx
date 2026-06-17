import { useMemo } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { ChartCard } from '@/components/admin/ChartCard';
import { InsightsPanel } from '@/components/admin/InsightsPanel';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { Badge } from '@/components/ui/badge';
import { ComboChart } from '@/components/admin/charts/ComboChart';
import { DonutChart, type DonutSegment } from '@/components/admin/charts/DonutChart';
import { FunnelSteps, type FunnelStage } from '@/components/admin/charts/FunnelSteps';
import { UserPlus, TrendingDown, Percent, DollarSign } from 'lucide-react';
import { useBusiness, useGrowth, useEngagement, useRevenue } from '@/hooks/useAdminMetrics';
import { useAdminTimeRange } from '@/hooks/useAdminTimeRange';
import {
  CHART_COLORS,
  SEMANTIC,
  formatCurrency,
  formatNumber,
} from '@/components/admin/chartTheme';
import { computeDelta, seriesFrom } from '@/lib/adminTrends';
import { computeBusinessInsights } from '@/lib/insights';

const FREE_PLANS = new Set(['free', 'anonymous', 'guest']);

const BusinessPage = () => {
  const { days } = useAdminTimeRange();
  const { data, isLoading, isError, refetch } = useBusiness(days);
  const growth = useGrowth(days);
  const engagement = useEngagement(days);
  const revenue = useRevenue(days);
  const d = data;

  const churnRate = d?.churn?.churnRate ?? 0;
  const conversionRate = d?.conversionRate?.rate ?? 0;
  const signupsTrend = computeDelta(seriesFrom(d?.signups?.daily, (row) => row.signups));
  const currency = revenue.data?.currency ?? d?.revenue?.currency ?? 'USD';
  const mrr = revenue.data?.mrr ?? d?.revenue?.mrr ?? null;

  const insights = useMemo(() => computeBusinessInsights(d), [d]);

  // Revenue & growth: merge estimated MRR per day with daily signups.
  const revenueGrowthData = useMemo(() => {
    const byDate = new Map<string, { date: string; mrr: number; signups: number }>();
    for (const r of revenue.data?.trend ?? []) {
      byDate.set(r.date, { date: r.date, mrr: r.mrr, signups: 0 });
    }
    for (const r of d?.signups?.daily ?? []) {
      const row = byDate.get(r.date) ?? { date: r.date, mrr: 0, signups: 0 };
      row.signups = r.signups;
      byDate.set(r.date, row);
    }
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [revenue.data, d?.signups]);

  // Plan distribution: latest snapshot per plan.
  const planSegments: DonutSegment[] = useMemo(() => {
    const rows = d?.planDistribution ?? [];
    if (!rows.length) return [];
    const latestDate = rows.reduce((max, r) => (r.date > max ? r.date : max), rows[0].date);
    const byPlan = new Map<string, number>();
    for (const r of rows.filter((r) => r.date === latestDate)) {
      byPlan.set(r.planName, (byPlan.get(r.planName) ?? 0) + r.users);
    }
    return [...byPlan.entries()].map(([name, value]) => ({ name, value }));
  }, [d?.planDistribution]);

  const payingUsers = planSegments
    .filter((s) => !FREE_PLANS.has(s.name.toLowerCase()))
    .reduce((sum, s) => sum + s.value, 0);

  // Conversion funnel: visitors → signups → activated → paying.
  const funnelStages: FunnelStage[] = useMemo(() => {
    const gvr = engagement.data?.guestVsRegistered;
    const visitors = gvr ? gvr.guestEvents + gvr.registeredEvents : 0;
    const signups = d?.signups?.total ?? 0;
    const activated = growth.data?.activationRate?.activated ?? 0;
    return [
      { label: 'Visitors', value: visitors },
      { label: 'Signups', value: signups },
      { label: 'Activated', value: activated },
      { label: 'Paying', value: payingUsers },
    ];
  }, [engagement.data, d?.signups, growth.data, payingUsers]);

  const hasFunnel = funnelStages.some((s) => s.value > 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader title="Business" description="Revenue, acquisition, and customer mix" />

      {isError ? (
        <MetricsErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard label="Total Signups" value={d?.signups?.total} icon={UserPlus} tone="success" color="text-success" isLoading={isLoading} trend={signupsTrend ?? undefined} />
            <StatCard label="Revenue (est.)" value={mrr != null ? formatCurrency(mrr, currency) : '—'} icon={DollarSign} tone="brand" subtitle="Estimated MRR" isLoading={isLoading || revenue.isLoading} />
            <StatCard label="Conversion Rate" value={`${(conversionRate * 100).toFixed(1)}%`} icon={Percent} tone="info" isLoading={isLoading} />
            <StatCard label="Churn Rate" value={`${(churnRate * 100).toFixed(1)}%`} icon={TrendingDown} tone="destructive" color={churnRate > 0.1 ? 'text-destructive' : 'text-foreground'} isLoading={isLoading} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Revenue & growth"
              description="Estimated MRR with daily signups"
              toolbar={<Badge variant="outline" className="text-[10px]">Estimated</Badge>}
              isLoading={isLoading || revenue.isLoading}
              awaitingData={revenueGrowthData.length === 0}
              exportData={{ filename: 'revenue-growth', rows: revenueGrowthData }}
            >
              <ComboChart
                data={revenueGrowthData}
                xKey="date"
                bars={[{ key: 'mrr', label: 'Est. MRR', color: CHART_COLORS[0] }]}
                lines={[{ key: 'signups', label: 'Signups', color: SEMANTIC.success }]}
                leftTickFormatter={(v) => formatCurrency(v, currency)}
                rightTickFormatter={formatNumber}
                valueFormatter={(v, key) => (key === 'mrr' ? formatCurrency(v, currency) : formatNumber(v))}
              />
            </ChartCard>

            <ChartCard
              title="Customer distribution"
              description="Active users by plan"
              isLoading={isLoading}
              awaitingData={planSegments.length === 0}
              exportData={{ filename: 'plan-distribution', rows: planSegments }}
            >
              <DonutChart data={planSegments} centerSubLabel="Users" />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Conversion funnel"
              description="Visitors → Signups → Activated → Paying"
              isLoading={isLoading || growth.isLoading || engagement.isLoading}
              awaitingData={!hasFunnel}
            >
              <FunnelSteps stages={funnelStages} />
            </ChartCard>

            <InsightsPanel insights={insights} title="Business insights" isLoading={isLoading} />
          </div>
        </>
      )}
    </div>
  );
};

export default BusinessPage;
