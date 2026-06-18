import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { FileStack, FilePlus2, Activity, AlertTriangle, HardDrive, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { KpiCard } from '@/components/admin/KpiCard';
import { ChartCard } from '@/components/admin/ChartCard';
import { InsightsPanel } from '@/components/admin/InsightsPanel';
import { MultiLineChart } from '@/components/admin/charts/MultiLineChart';
import { DonutChart } from '@/components/admin/charts/DonutChart';
import { QuickActions } from '@/components/app/QuickActions';
import { JobCard } from '@/components/app/JobCard';
import { DocumentCard } from '@/components/app/DocumentCard';
import { StorageMeter } from '@/components/app/StorageMeter';
import { ActivityTimeline } from '@/components/app/ActivityTimeline';
import { useJobHistory, useDeleteJob } from '@/hooks/useJobHistory';
import { useAuth } from '@/auth/useAuth';
import { CHART_COLORS, SEMANTIC, formatCompact, formatNumber } from '@/components/admin/chartTheme';
import { computeDelta, seriesFrom } from '@/lib/adminTrends';
import {
  summarize,
  dailySeries,
  statusBreakdown,
  storageByCategory,
  activityFeed,
  userInsights,
  isActive,
  formatBytes,
} from '@/lib/userMetrics';
import { toast } from '@/lib/toast';
import type { Job } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  Completed: SEMANTIC.success,
  Active: CHART_COLORS[1],
  Failed: SEMANTIC.danger,
};

const Dashboard = () => {
  const { jobs, isLoading, isError, refetch } = useJobHistory();
  const deleteJob = useDeleteJob();
  const { user } = useAuth();
  const firstName = (user?.fullName || user?.email || 'there').split(/[\s@]/)[0];

  const summary = useMemo(() => summarize(jobs), [jobs]);
  const series = useMemo(() => dailySeries(jobs, 30), [jobs]);
  const status = useMemo(() => statusBreakdown(jobs).map((s) => ({ ...s, color: STATUS_COLORS[s.name] })), [jobs]);
  const storage = useMemo(() => storageByCategory(jobs), [jobs]);
  const activity = useMemo(() => activityFeed(jobs, 8), [jobs]);
  const insights = useMemo(() => userInsights(jobs), [jobs]);
  const activeJobs = useMemo(() => jobs.filter(isActive), [jobs]);
  const recent = useMemo(
    () => [...jobs].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 8),
    [jobs],
  );

  const createdSeries = series.map((d) => d.created);
  const processedSeries = series.map((d) => d.processed);
  const createdDelta = computeDelta(seriesFrom(series, (d) => d.created));
  const processedDelta = computeDelta(seriesFrom(series, (d) => d.processed));

  const handleDelete = async (job: Job) => {
    try {
      await deleteJob.mutateAsync({ toolId: job.toolId, jobId: job.id });
      toast.success('File deleted');
    } catch (error) {
      toast.error('Could not delete file', error instanceof Error ? error.message : undefined);
    }
  };

  const kpis = [
    { label: 'Total Documents', value: formatNumber(summary.total), sparkline: createdSeries, deltaPct: createdDelta?.deltaPct, to: '/app/documents' as const },
    { label: 'Processed', value: formatNumber(summary.processed), sparkline: processedSeries, deltaPct: processedDelta?.deltaPct, status: 'healthy' as const, to: '/app/documents' as const },
    { label: 'Active Jobs', value: formatNumber(summary.active), status: 'healthy' as const, to: '/app/documents?status=active' as const },
    { label: 'Failed', value: formatNumber(summary.failed), invertGood: true, status: summary.failed > 0 ? ('warning' as const) : ('healthy' as const), to: '/app/documents?status=failed' as const },
    { label: 'Storage Used', value: formatBytes(summary.storageBytes), status: 'healthy' as const },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Helmet>
        <title>Dashboard — Fyredocs</title>
      </Helmet>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName} 👋</h1>
        <p className="mt-1 text-body-sm text-muted-foreground">Your documents, processing, and recent activity at a glance.</p>
      </div>

      {isError ? (
        <MetricsErrorState title="Could not load your workspace" onRetry={() => refetch()} />
      ) : !isLoading && jobs.length === 0 ? (
        <EmptyState
          icon={FileStack}
          title="No documents yet"
          description="Run your first tool and your processed files will appear here, ready to download, search, and manage."
          action={
            <Button asChild>
              <Link to="/all-tools">Upload your first document</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid auto-rows-fr grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {kpis.map((k) => (
              <KpiCard key={k.label} {...k} isLoading={isLoading} />
            ))}
          </div>

          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">Quick actions</h2>
            <QuickActions />
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                <div>
                  <h3 className="text-sm font-medium">Active jobs</h3>
                  <p className="text-caption text-muted-foreground">Currently processing or queued</p>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {activeJobs.length === 0 ? (
                  <EmptyState size="sm" icon={Activity} title="Nothing processing" description="Start a tool and progress will show here live." />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeJobs.map((job) => (
                      <JobCard key={job.id} job={job} onCancel={handleDelete} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <InsightsPanel insights={insights} title="Insights" isLoading={isLoading} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Documents over time"
              description="Uploaded vs processed — last 30 days"
              isLoading={isLoading}
              exportData={{ filename: 'documents-over-time', rows: series }}
            >
              <MultiLineChart
                data={series}
                xKey="date"
                series={[
                  { key: 'processed', label: 'Processed', color: SEMANTIC.success },
                  { key: 'created', label: 'Uploaded', color: CHART_COLORS[1] },
                ]}
                leftTickFormatter={formatCompact}
                valueFormatter={(v) => formatNumber(v)}
              />
            </ChartCard>

            <ChartCard
              title="Processing status"
              description="Across all your documents"
              isLoading={isLoading}
              awaitingData={status.length === 0}
              awaitingMessage="No documents to summarize yet."
            >
              <DonutChart data={status} centerSubLabel="Documents" />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                <h3 className="text-sm font-medium">Recent documents</h3>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/app/documents">
                    View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {recent.map((job) => (
                    <DocumentCard key={job.id} job={job} onDelete={handleDelete} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <StorageMeter totalBytes={summary.storageBytes} segments={storage} />
          </div>

          <Card>
            <CardHeader className="p-4 pb-2">
              <h3 className="text-sm font-medium">Recent activity</h3>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <ActivityTimeline items={activity} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;
