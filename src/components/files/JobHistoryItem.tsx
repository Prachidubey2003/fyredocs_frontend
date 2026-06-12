import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Download, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ToolIcon } from '@/components/icons/ToolIcon';
import { RetentionCountdown } from './RetentionCountdown';
import { getToolById } from '@/config/tools';
import { toolNavName } from '@/config/navigation';
import { buildApiUrl } from '@/lib/apiClient';
import { buildDownloadPath } from '@/lib/toolApi';
import { displayJobStatus } from '@/lib/jobMapper';
import type { Job } from '@/types';

export const isJobExpired = (job: Job): boolean =>
  job.state === 'completed' && !!job.result && job.result.expiresAt.getTime() <= Date.now();

const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export interface JobHistoryItemProps {
  job: Job;
  onDelete: (job: Job) => void | Promise<void>;
}

export function JobHistoryItem({ job, onDelete }: JobHistoryItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const tool = getToolById(job.toolId);
  const expired = isJobExpired(job);
  const canDownload = job.state === 'completed' && !expired;
  const downloadUrl = buildApiUrl(buildDownloadPath(job.toolId, job.id));
  const fileName = job.result?.fileName;
  const fileSize = job.result ? formatFileSize(job.result.fileSize) : '';

  if (!tool) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <ToolIcon icon={tool.icon} category={tool.category} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Text as="span" variant="body-sm" className="font-semibold">
              {toolNavName(tool)}
            </Text>
            <StatusBadge status={expired ? 'expired' : displayJobStatus(job.state)} />
          </div>
          <Text variant="caption" tone="muted" className="truncate">
            {fileName ? `${fileName}${fileSize ? ` · ${fileSize}` : ''} · ` : ''}
            {format(job.createdAt, 'p')}
          </Text>
          {job.state === 'failed' && job.error && (
            <Text variant="caption" className="truncate text-destructive">
              {job.error.message}
            </Text>
          )}
          {job.state === 'completed' && job.result && (
            <RetentionCountdown expiresAt={job.result.expiresAt} className="mt-0.5" />
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
        {canDownload ? (
          <Button variant="outline" size="sm" asChild>
            <a href={downloadUrl} download>
              <Download aria-hidden />
              Download
            </a>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <Download aria-hidden />
            Download
          </Button>
        )}
        <Button variant="ghost" size="sm" asChild>
          <Link to={tool.route}>
            <RotateCcw aria-hidden />
            Run again
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-destructive"
          aria-label={`Delete ${fileName ?? toolNavName(tool)} job`}
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 aria-hidden />
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this file?"
        description={`${fileName ?? 'This job'} will be permanently removed from your history. This cannot be undone.`}
        confirmLabel="Delete"
        tone="destructive"
        onConfirm={() => onDelete(job)}
      />
    </div>
  );
}
