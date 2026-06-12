import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { FolderClock, RefreshCw, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/LoadingState';
import { JobHistoryList } from '@/components/files/JobHistoryList';
import { useDeleteJob, useJobHistory } from '@/hooks/useJobHistory';
import { useAuth } from '@/auth/useAuth';
import { usePlan } from '@/hooks/usePlans';
import { NAV_GROUPS } from '@/config/navigation';
import { getToolById } from '@/config/tools';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import type { Job, ToolNavGroup } from '@/types';

type StatusFilter = 'all' | 'completed' | 'failed' | 'expiring';
type CategoryFilter = ToolNavGroup | 'all';

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed', label: 'Failed' },
  { id: 'expiring', label: 'Expiring soon' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

const isExpiringSoon = (job: Job): boolean => {
  if (job.state !== 'completed' || !job.result) return false;
  const msLeft = job.result.expiresAt.getTime() - Date.now();
  return msLeft > 0 && msLeft <= DAY_MS;
};

const matchesStatus = (job: Job, filter: StatusFilter): boolean => {
  switch (filter) {
    case 'completed':
      return job.state === 'completed';
    case 'failed':
      return job.state === 'failed';
    case 'expiring':
      return isExpiringSoon(job);
    default:
      return true;
  }
};

const MyFilesPage = () => {
  const { jobs, isLoading, isError, isFetching, refetch } = useJobHistory();
  const deleteJob = useDeleteJob();
  const { plan } = useAuth();
  const { plan: planDetails } = usePlan(plan);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        if (!matchesStatus(job, statusFilter)) return false;
        if (categoryFilter === 'all') return true;
        return getToolById(job.toolId)?.navGroup === categoryFilter;
      }),
    [jobs, statusFilter, categoryFilter],
  );

  const hasActiveFilters = statusFilter !== 'all' || categoryFilter !== 'all';

  const handleDelete = async (job: Job) => {
    try {
      await deleteJob.mutateAsync({ toolId: job.toolId, jobId: job.id });
      toast.success('File deleted');
    } catch (error) {
      toast.error('Could not delete file', error instanceof Error ? error.message : undefined);
    }
  };

  const retentionDescription = planDetails
    ? `Your processed files, kept for ${planDetails.retentionDays} ${planDetails.retentionDays === 1 ? 'day' : 'days'} on the ${planDetails.name} plan.`
    : 'Your processed files — kept on a plan-based retention schedule.';

  return (
    <>
      <Helmet>
        <title>My Files — Fyredocs</title>
        <meta name="description" content="Download, re-run, or delete files from your recent Fyredocs jobs." />
      </Helmet>

      <div className="container py-12">
        <PageHeader
          title="My Files"
          description={retentionDescription}
          actions={
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
              <RefreshCw className={cn(isFetching && 'animate-spin')} aria-hidden />
              Refresh
            </Button>
          }
        />

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatusFilter(filter.id)}
                aria-pressed={statusFilter === filter.id}
                className={cn(
                  'rounded-full px-4 py-1.5 text-body-sm font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  statusFilter === filter.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}>
            <SelectTrigger className="w-48" aria-label="Filter by tool category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {NAV_GROUPS.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : isError ? (
          <ErrorState
            title="Could not load your files"
            description="Something went wrong while fetching your job history."
            onRetry={() => void refetch()}
          />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={FolderClock}
            title="No files yet — run your first tool"
            description="Files from the tools you run will show up here, ready to download until they expire."
            action={
              <Button asChild>
                <Link to="/all-tools">Browse all tools</Link>
              </Button>
            }
          />
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No files match your filters"
            description="Try a different status or tool category."
            action={
              hasActiveFilters ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter('all');
                    setCategoryFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <JobHistoryList jobs={filteredJobs} onDelete={handleDelete} />
        )}
      </div>
    </>
  );
};

export default MyFilesPage;
