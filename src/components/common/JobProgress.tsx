import { Job } from '@/types';
import { CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnimatePresence, FadeIn } from '@/components/ui/animated';

interface JobProgressProps {
  job: Job;
  onCancel?: () => void;
  onRetry?: () => void;
  onDownload?: () => void;
  onReset?: () => void;
  className?: string;
}

const stateConfig = {
  pending: {
    icon: Clock,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    label: 'Preparing...',
  },
  queued: {
    icon: Clock,
    color: 'text-job-queued',
    bgColor: 'bg-job-queued/10',
    label: 'In queue',
  },
  processing: {
    icon: Loader2,
    color: 'text-job-processing',
    bgColor: 'bg-job-processing/10',
    label: 'Processing',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-job-completed',
    bgColor: 'bg-job-completed/10',
    label: 'Complete',
  },
  failed: {
    icon: AlertCircle,
    color: 'text-job-failed',
    bgColor: 'bg-job-failed/10',
    label: 'Failed',
  },
};

export const JobProgress = ({
  job,
  onCancel,
  onRetry,
  onDownload,
  onReset,
  className,
}: JobProgressProps) => {
  const config = stateConfig[job.state];
  const Icon = config.icon;
  const isAnimating = job.state === 'processing' || job.state === 'pending';

  const handleDownload = () => {
    if (!job.result?.downloadUrl) return;
    const a = document.createElement('a');
    a.href = job.result.downloadUrl;
    a.download = job.result.fileName || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (seconds?: number): string => {
    if (!seconds) return '';
    if (seconds < 60) return `${seconds}s remaining`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s remaining`;
  };

  return (
    <div className={cn('rounded-xl border bg-card p-6', className)}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200',
            config.bgColor
          )}
        >
          <Icon
            className={cn(
              'w-6 h-6',
              config.color,
              isAnimating && 'animate-spin'
            )}
          />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-lg">{config.label}</h3>
          <p className="text-sm text-muted-foreground">
            {job.progress.currentStep}
          </p>
        </div>

        {job.progress.estimatedTimeRemaining && job.state === 'processing' && (
          <span className="text-sm text-muted-foreground">
            {formatTime(job.progress.estimatedTimeRemaining)}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <AnimatePresence>
        {(job.state === 'processing' || job.state === 'queued') && (
          <FadeIn motionKey="progress-bar" className="mb-6">
            <Progress value={job.progress.percentage} className="h-2" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>
                Step {job.progress.completedSteps + 1} of{' '}
                {job.progress.totalSteps}
              </span>
              <span>{job.progress.percentage}%</span>
            </div>
          </FadeIn>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {job.state === 'failed' && job.error && (
          <FadeIn motionKey="error-msg" slide className="mb-6">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">
                {job.error.message}
              </p>
              {job.error.isRetryable && (
                <p className="text-xs text-muted-foreground mt-1">
                  This error is retryable. You can try again.
                </p>
              )}
            </div>
          </FadeIn>
        )}
      </AnimatePresence>

      {/* Success result */}
      <AnimatePresence>
        {job.state === 'completed' && job.result && (
          <FadeIn motionKey="success-result" slide className="mb-6">
            <div className="p-4 rounded-lg bg-job-completed/10 border border-job-completed/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    {job.result.fileName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(job.result.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  onClick={handleDownload}
                  className="bg-gradient-primary"
                >
                  Download
                </Button>
              </div>
            </div>
          </FadeIn>
        )}
      </AnimatePresence>

      {/* Actions */}
      <AnimatePresence>
        {(job.state === 'processing' || job.state === 'queued') && onCancel && (
          <FadeIn motionKey="cancel-action">
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            </div>
          </FadeIn>
        )}

        {job.state === 'failed' && job.error?.isRetryable && onRetry && (
          <FadeIn motionKey="retry-action">
            <div className="flex gap-3">
              <Button onClick={onRetry} className="flex-1">
                Retry
              </Button>
            </div>
          </FadeIn>
        )}

        {(job.state === 'completed' || job.state === 'failed') && onReset && (
          <FadeIn motionKey="reset-action">
            <Button variant="outline" className="w-full" onClick={onReset}>
              Start over with new file
            </Button>
          </FadeIn>
        )}
      </AnimatePresence>
    </div>
  );
};
