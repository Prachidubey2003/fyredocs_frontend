import { useMemo } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { ChartCard } from '@/components/admin/ChartCard';
import { InsightsPanel } from '@/components/admin/InsightsPanel';
import { HealthStatusStrip, type HealthSegment } from '@/components/admin/HealthStatusStrip';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiLineChart } from '@/components/admin/charts/MultiLineChart';
import { StackedAreaChart } from '@/components/admin/charts/StackedAreaChart';
import { DonutChart } from '@/components/admin/charts/DonutChart';
import { Activity, Zap, Timer, BarChart3 } from 'lucide-react';
import { useSystem, useQueueStatus } from '@/hooks/useAdminMetrics';
import {
  CHART_COLORS,
  SEMANTIC,
  formatHourTick,
  formatNumber,
  type HealthStatus,
} from '@/components/admin/chartTheme';
import { computeSystemInsights } from '@/lib/insights';

function lagToneClass(seconds: number): string {
  if (seconds > 10) return 'text-destructive';
  if (seconds > 2) return 'text-warning';
  return 'text-success';
}

const SystemPage = () => {
  const { data, isLoading, isError, refetch } = useSystem();
  const queues = useQueueStatus();
  const d = data;
  const q = queues.data;

  const avgLag = d?.processingLag?.avgSeconds ?? 0;
  const insights = useMemo(() => computeSystemInsights(d), [d]);

  const ingestion = d?.ingestionRate ?? [];
  const eventTypes = (d?.eventsByType ?? []).map((r) => ({ name: r.eventType, value: r.count }));
  const pipeline = q?.throughput ?? [];

  const healthSegments: HealthSegment[] = useMemo(() => {
    const segs: HealthSegment[] = [];
    if (d) {
      const ingestStatus: HealthStatus = (d.eventsLastHour ?? 0) > 0 ? 'healthy' : 'warning';
      segs.push({ label: 'Ingestion', status: ingestStatus, detail: `${formatNumber(d.eventsLastHour)} events/hr` });
      const lagStatus: HealthStatus = avgLag > 10 ? 'critical' : avgLag > 2 ? 'warning' : 'healthy';
      segs.push({ label: 'Processing', status: lagStatus, detail: `${avgLag.toFixed(2)}s avg lag` });
    }
    if (q) {
      segs.push({ label: 'DLQ', status: q.dlq.messages > 0 ? 'warning' : 'healthy', detail: `${q.dlq.messages} dead-lettered` });
      const lagPending = q.analyticsLag.analytics.pending + q.analyticsLag.analytics.ackPending;
      segs.push({ label: 'Analytics consumer', status: lagPending > 1000 ? 'warning' : 'healthy', detail: `${lagPending} pending` });
    }
    return segs;
  }, [d, q, avgLag]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader title="System Health" description="Event ingestion, pipeline flow, and live activity" />

      {isError ? (
        <MetricsErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium">Health summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {healthSegments.length > 0 ? (
                <HealthStatusStrip segments={healthSegments} />
              ) : (
                <p className="text-caption text-muted-foreground">{isLoading ? 'Loading…' : 'No health data available.'}</p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Active Users Now" value={d?.activeUsersNow} icon={Activity} tone="success" color="text-success" isLoading={isLoading} />
            <StatCard label="Events/Hour" value={d?.eventsLastHour} icon={Zap} tone="info" isLoading={isLoading} />
            <StatCard label="Events/24h" value={d?.eventsLast24h} icon={Zap} tone="info" isLoading={isLoading} />
            <StatCard label="Avg Lag" value={`${avgLag.toFixed(2)}s`} icon={Timer} tone="warning" color={lagToneClass(avgLag)} isLoading={isLoading} />
            <StatCard label="Total Events" value={d?.totalEvents?.toLocaleString()} icon={BarChart3} tone="default" isLoading={isLoading} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Event processing"
              description="Events ingested per hour — last 24 hours"
              isLoading={isLoading}
              awaitingData={ingestion.length === 0}
              exportData={{ filename: 'ingestion-rate', rows: ingestion }}
            >
              <MultiLineChart
                data={ingestion}
                xKey="hour"
                xTickFormatter={formatHourTick}
                series={[{ key: 'count', label: 'Events', color: CHART_COLORS[2] }]}
                leftTickFormatter={formatNumber}
                valueFormatter={(v) => formatNumber(v)}
              />
            </ChartCard>

            <InsightsPanel insights={insights} title="System insights" isLoading={isLoading} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Event pipeline"
              description="Processed, queued, and failed events over time"
              isLoading={queues.isLoading}
              awaitingData={pipeline.length === 0}
              awaitingMessage="Pipeline throughput requires the queue-status endpoint."
              exportData={{ filename: 'event-pipeline', rows: pipeline }}
            >
              <StackedAreaChart
                data={pipeline}
                xKey="time"
                xTickFormatter={formatHourTick}
                valueTickFormatter={formatNumber}
                series={[
                  { key: 'processed', label: 'Processed', color: SEMANTIC.success },
                  { key: 'queued', label: 'Queued', color: SEMANTIC.warning },
                  { key: 'failed', label: 'Failed', color: SEMANTIC.danger },
                ]}
              />
            </ChartCard>

            <ChartCard
              title="Events by type"
              description="Distribution in the last hour"
              isLoading={isLoading}
              awaitingData={eventTypes.length === 0}
              exportData={{ filename: 'events-by-type', rows: eventTypes }}
            >
              <DonutChart data={eventTypes} centerSubLabel="Events" />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
};

export default SystemPage;
