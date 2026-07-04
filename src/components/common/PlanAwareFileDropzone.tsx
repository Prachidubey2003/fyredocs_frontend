import { forwardRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ToolDefinition } from '@/types';
import { FileDropzone, FileDropzoneHandle } from '@/components/common/FileDropzone';
import { useAuth } from '@/auth/useAuth';
import { usePlan } from '@/hooks/usePlans';

export type PlanLimitReason = 'fileSize' | 'fileCount';

interface PlanAwareFileDropzoneProps {
  tool: ToolDefinition;
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  /** Files already selected — needed to enforce the plan's file-count limit. */
  currentFileCount?: number;
  /**
   * Called when the selection violates the user's plan limits (the tighter of
   * plan vs tool limits). The violating selection is NOT forwarded.
   */
  onLimitExceeded?: (reason: PlanLimitReason) => void;
}

/**
 * Drop-in replacement for FileDropzone that automatically enforces and
 * displays the current user's plan-based file size and file count limits.
 * Limits are fetched from GET /auth/plans and cached for 5 minutes.
 *
 * Exposes `openFileDialog()` via ref for "Add more files" actions.
 */
export const PlanAwareFileDropzone = forwardRef<FileDropzoneHandle, PlanAwareFileDropzoneProps>(
  (
    {
      tool,
      onFilesSelected,
      disabled = false,
      className,
      compact = false,
      currentFileCount = 0,
      onLimitExceeded,
    },
    ref
  ) => {
    const { plan } = useAuth();
    const { plan: planData } = usePlan(plan);
    const { plan: proPlan } = usePlan('pro');

    const MB = 1024 * 1024;
    const planMaxFileSize = planData ? planData.maxFileSizeMb * MB : undefined;
    const planMaxFiles = planData ? planData.maxFilesPerJob : undefined;

    // The tighter limit wins.
    const effectiveMaxFileSize = Math.min(tool.maxFileSize, planMaxFileSize ?? Infinity);
    const effectiveMaxFiles = Math.min(tool.maxFiles, planMaxFiles ?? Infinity);

    const handleFilesSelected = useCallback(
      (files: File[]) => {
        if (onLimitExceeded) {
          if (currentFileCount + files.length > effectiveMaxFiles) {
            onLimitExceeded('fileCount');
            return;
          }
          if (files.some((file) => file.size > effectiveMaxFileSize)) {
            onLimitExceeded('fileSize');
            return;
          }
        }
        onFilesSelected(files);
      },
      [currentFileCount, effectiveMaxFileSize, effectiveMaxFiles, onFilesSelected, onLimitExceeded]
    );

    return (
      <div className="space-y-2">
        <FileDropzone
          ref={ref}
          tool={tool}
          onFilesSelected={handleFilesSelected}
          disabled={disabled}
          className={className}
          compact={compact}
          maxFileSize={Number.isFinite(effectiveMaxFileSize) ? effectiveMaxFileSize : undefined}
          maxFiles={Number.isFinite(effectiveMaxFiles) ? effectiveMaxFiles : undefined}
        />
        {plan !== 'pro' && planData && (
          <p className="text-xs text-center text-muted-foreground">
            {plan === 'guest' ? (
              <>
                <Link to="/signup" className="underline hover:text-foreground">
                  Sign up free
                </Link>{' '}
                for {planData.maxFileSizeMb}MB uploads &amp; {planData.maxFilesPerJob}-file jobs.{' '}
                <Link to="/pricing" className="underline hover:text-foreground">
                  Upgrade to Pro
                </Link>
                {proPlan ? ` for ${proPlan.maxFileSizeMb}MB.` : '.'}
              </>
            ) : (
              <>
                <Link to="/pricing" className="underline hover:text-foreground">
                  Upgrade to Pro
                </Link>
                {proPlan
                  ? ` for ${proPlan.maxFileSizeMb}MB files & ${proPlan.maxFilesPerJob} files per job.`
                  : '.'}
              </>
            )}
          </p>
        )}
      </div>
    );
  }
);

PlanAwareFileDropzone.displayName = 'PlanAwareFileDropzone';
