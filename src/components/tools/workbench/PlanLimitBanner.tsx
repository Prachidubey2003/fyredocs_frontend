import { Gauge } from 'lucide-react';
import { FileUpload, ToolDefinition } from '@/types';
import { useAuth } from '@/auth/useAuth';
import { usePlan } from '@/hooks/usePlans';
import { cn } from '@/lib/utils';

interface PlanLimitBannerProps {
  tool: ToolDefinition;
  files: FileUpload[];
  className?: string;
}

const formatSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${bytes}B`;
};

/**
 * Live usage meter for the current selection against the user's effective
 * limits (the tighter of plan vs tool limits). Warning tone near the limits.
 */
export const PlanLimitBanner = ({ tool, files, className }: PlanLimitBannerProps) => {
  const { plan } = useAuth();
  const { plan: planData } = usePlan(plan);

  const MB = 1024 * 1024;
  const maxFiles = Math.min(tool.maxFiles, planData ? planData.maxFilesPerJob : Infinity);
  const maxFileSize = Math.min(tool.maxFileSize, planData ? planData.maxFileSizeMb * MB : Infinity);

  const fileCount = files.length;
  const largestFile = files.reduce((max, f) => Math.max(max, f.file.size), 0);

  const nearLimit =
    (maxFiles > 1 && Number.isFinite(maxFiles) && fileCount / maxFiles >= 0.8) ||
    (Number.isFinite(maxFileSize) && largestFile / maxFileSize >= 0.8);

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-caption transition-colors',
        nearLimit
          ? 'border-warning/30 bg-warning-subtle text-warning-subtle-foreground'
          : 'border-border bg-muted/30 text-muted-foreground',
        className
      )}
    >
      <Gauge className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        {fileCount} of {Number.isFinite(maxFiles) ? maxFiles : '∞'} files
        {' · '}
        {formatSize(largestFile)} of {Number.isFinite(maxFileSize) ? formatSize(maxFileSize) : '∞'} per file
      </span>
    </div>
  );
};
