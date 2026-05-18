import { Link } from 'react-router-dom';
import { ToolDefinition } from '@/types';
import { FileDropzone } from '@/components/common/FileDropzone';
import { useAuth } from '@/auth/useAuth';
import { usePlan } from '@/hooks/usePlans';

interface PlanAwareFileDropzoneProps {
  tool: ToolDefinition;
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}

/**
 * Drop-in replacement for FileDropzone that automatically enforces and
 * displays the current user's plan-based file size and file count limits.
 * Limits are fetched from GET /auth/plans and cached for 5 minutes.
 */
export const PlanAwareFileDropzone = ({
  tool,
  onFilesSelected,
  disabled = false,
  className,
  compact = false,
}: PlanAwareFileDropzoneProps) => {
  const { plan } = useAuth();
  const { plan: planData } = usePlan(plan);

  const MB = 1024 * 1024;
  const maxFileSize = planData ? planData.maxFileSizeMb * MB : undefined;
  const maxFiles = planData ? planData.maxFilesPerJob : undefined;

  return (
    <div className="space-y-2">
      <FileDropzone
        tool={tool}
        onFilesSelected={onFilesSelected}
        disabled={disabled}
        className={className}
        compact={compact}
        maxFileSize={maxFileSize}
        maxFiles={maxFiles}
      />
      {plan !== 'pro' && planData && (
        <p className="text-xs text-center text-muted-foreground">
          {plan === 'anonymous' ? (
            <>
              <Link to="/signup" className="underline hover:text-foreground">
                Sign up free
              </Link>{' '}
              for {planData.maxFileSizeMb}MB uploads &amp;{' '}
              {planData.maxFilesPerJob}-file jobs.{' '}
              <Link to="/pricing" className="underline hover:text-foreground">
                Upgrade to Pro
              </Link>{' '}
              for 500MB.
            </>
          ) : (
            <>
              <Link to="/pricing" className="underline hover:text-foreground">
                Upgrade to Pro
              </Link>{' '}
              for 500MB files &amp; 50 files per job.
            </>
          )}
        </p>
      )}
    </div>
  );
};
