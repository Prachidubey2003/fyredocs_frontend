import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type WorkbenchStage = 'upload' | 'configure' | 'processing' | 'done' | 'error';

interface ToolStepperProps {
  stage: WorkbenchStage;
  /** Whether the tool has a configure step (options panel or bespoke body). */
  hasConfigure: boolean;
  className?: string;
}

/**
 * Presentational stage indicator: Upload → (Configure) → Process → Download.
 * Compresses to dots + current label on mobile.
 */
export const ToolStepper = ({ stage, hasConfigure, className }: ToolStepperProps) => {
  const steps = hasConfigure
    ? ['Upload', 'Configure', 'Process', 'Download']
    : ['Upload', 'Process', 'Download'];

  const currentIndex = (() => {
    switch (stage) {
      case 'upload':
        return 0;
      case 'configure':
        return hasConfigure ? 1 : 0;
      case 'processing':
      case 'error':
        return hasConfigure ? 2 : 1;
      case 'done':
        return hasConfigure ? 3 : 2;
      default:
        return 0;
    }
  })();

  return (
    <nav aria-label="Progress" className={cn('mb-8', className)}>
      {/* Desktop: full steps */}
      <ol className="hidden items-center justify-center gap-2 sm:flex">
        {steps.map((label, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <li key={label} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border text-caption font-semibold transition-colors',
                    isDone && 'border-success bg-success text-success-foreground',
                    isCurrent &&
                      (stage === 'error' && index === currentIndex
                        ? 'border-destructive bg-destructive-subtle text-destructive-subtle-foreground'
                        : 'border-primary bg-primary text-primary-foreground'),
                    !isDone && !isCurrent && 'border-border bg-muted text-muted-foreground'
                  )}
                  aria-hidden
                >
                  {isDone ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span
                  className={cn(
                    'text-body-sm font-medium',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <span
                  className={cn('h-px w-8 md:w-12', isDone ? 'bg-success' : 'bg-border')}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: dots + current label */}
      <div className="flex flex-col items-center gap-2 sm:hidden">
        <div className="flex items-center gap-1.5">
          {steps.map((label, index) => (
            <span
              key={label}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                index < currentIndex && 'bg-success',
                index === currentIndex && 'w-5 rounded-full bg-primary',
                index > currentIndex && 'bg-muted'
              )}
              aria-hidden
            />
          ))}
        </div>
        <span className="text-body-sm font-medium text-foreground">{steps[currentIndex]}</span>
      </div>
    </nav>
  );
};
