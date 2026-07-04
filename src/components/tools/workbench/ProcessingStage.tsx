import { useEffect, useState } from 'react';
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
  // Backends emit only coarse progress (e.g. 20 → 100), so ease a simulated value
  // upward while waiting to avoid a 0→100 jump. It creeps toward ~95% and always
  // yields to any higher real backend progress (see `pct` below).
  const [eased, setEased] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setEased((prev) => (prev >= 95 ? prev : prev + (95 - prev) * 0.06));
    }, 300);
    return () => clearInterval(id);
  }, []);

  const totalSteps = job.progress.totalSteps;
  // Never regress (max with real progress) and never show 100 until we leave this
  // stage on completion.
  const pct = Math.min(99, Math.max(job.progress.percentage, Math.round(eased)));
  const step = Math.min(Math.floor((pct / 100) * totalSteps) + 1, totalSteps);

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
        value={pct}
        className="h-2 [&>div]:transition-all [&>div]:duration-slow"
      />
      <div className="mt-2 flex justify-between text-body-sm text-muted-foreground">
        <span>
          Step {step} of {totalSteps}
        </span>
        <span>{pct}%</span>
      </div>

      <div className="mt-6">
        <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
      </div>
    </div>
  );
};
