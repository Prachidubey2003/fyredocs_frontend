import { format } from 'date-fns';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ToolIcon } from '@/components/icons/ToolIcon';
import { getToolById } from '@/config/tools';
import { toolNavName } from '@/config/navigation';
import { displayJobStatus } from '@/lib/jobMapper';
import type { Job } from '@/types';

export interface JobCardProps {
  job: Job;
  onCancel?: (job: Job) => void | Promise<void>;
}

/** A running/queued job with live progress and an ETA. */
export function JobCard({ job, onCancel }: JobCardProps) {
  const tool = getToolById(job.toolId);
  if (!tool) return null;

  const pct = job.progress?.percentage ?? 0;
  const eta = job.progress?.estimatedTimeRemaining;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <ToolIcon icon={tool.icon} category={tool.category} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{job.result?.fileName ?? toolNavName(tool)}</p>
          <p className="truncate text-caption text-muted-foreground">
            {toolNavName(tool)} · started {format(job.createdAt, 'p')}
          </p>
        </div>
        <StatusBadge status={displayJobStatus(job.state)} pulse={job.state === 'queued'} />
      </div>

      <div className="space-y-1.5">
        <Progress value={pct} className="h-1.5" />
        <div className="flex items-center justify-between text-caption text-muted-foreground tabular-nums">
          <span>{pct}%</span>
          <span>{eta != null && eta > 0 ? `~${eta}s left` : job.state === 'queued' ? 'Waiting in queue' : 'Processing…'}</span>
        </div>
      </div>

      {onCancel && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onCancel(job)}>
            <X className="h-4 w-4" aria-hidden />
            Cancel
          </Button>
        </div>
      )}
    </Card>
  );
}
