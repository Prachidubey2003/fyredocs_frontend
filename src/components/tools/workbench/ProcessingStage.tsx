import { Job } from '@/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

interface ProcessingStageProps {
  job: Job;
  onCancel: () => void;
  className?: string;
}

// Queued/pending are backend implementation details — every in-flight state
// presents as "Processing" to the user.
const STAGE_COPY: Record<string, string> = {
  pending: 'Starting your job…',
  queued: 'Working on your files…',
  processing: 'Working on your files…',
};

/** Replaces JobProgress's processing UI. Monotonic progress lives in useJob. */
export const ProcessingStage = ({ job, onCancel, className }: ProcessingStageProps) => {
  return (
    <div className={cn('rounded-xl border bg-card p-6', className)}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-h4 font-semibold">{job.progress.currentStep}</h3>
          <Text variant="body-sm" tone="muted" className="mt-1">
            {STAGE_COPY[job.state] ?? 'Working on your files…'}
          </Text>
        </div>
        <StatusBadge status="processing" />
      </div>

      <Progress
        value={job.progress.percentage}
        className="h-2 [&>div]:transition-all [&>div]:duration-slow"
      />
      <div className="mt-2 flex justify-between text-body-sm text-muted-foreground">
        <span>
          Step {Math.min(job.progress.completedSteps + 1, job.progress.totalSteps)} of{' '}
          {job.progress.totalSteps}
        </span>
        <span>{job.progress.percentage}%</span>
      </div>

      <div className="mt-6">
        <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
      </div>
    </div>
  );
};
