import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Download, MoreVertical, RotateCcw, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ToolIcon } from '@/components/icons/ToolIcon';
import { getToolById } from '@/config/tools';
import { toolNavName } from '@/config/navigation';
import { buildApiUrl } from '@/lib/apiClient';
import { buildDownloadPath } from '@/lib/toolApi';
import { displayJobStatus } from '@/lib/jobMapper';
import { formatBytes, isExpired } from '@/lib/userMetrics';
import { cn } from '@/lib/utils';
import type { Job } from '@/types';

export interface DocumentCardProps {
  job: Job;
  onDelete: (job: Job) => void | Promise<void>;
  /** Compact list row instead of a grid card. */
  variant?: 'grid' | 'row';
}

export function DocumentCard({ job, onDelete, variant = 'grid' }: DocumentCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const tool = getToolById(job.toolId);
  if (!tool) return null;

  const expired = isExpired(job);
  const canDownload = job.state === 'completed' && !expired;
  const downloadUrl = buildApiUrl(buildDownloadPath(job.toolId, job.id));
  const title = job.result?.fileName ?? toolNavName(tool);
  const meta = [tool && toolNavName(tool), job.result ? formatBytes(job.result.fileSize) : null]
    .filter(Boolean)
    .join(' · ');

  const actions = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="Document actions">
          <MoreVertical className="h-4 w-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild disabled={!canDownload}>
          <a href={canDownload ? downloadUrl : undefined} download>
            <Download className="mr-2 h-4 w-4" aria-hidden />
            Download
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={tool.route}>
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
            Run again
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" aria-hidden />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const confirm = (
    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      title="Delete this file?"
      description={`${title} will be permanently removed from your history. This cannot be undone.`}
      confirmLabel="Delete"
      tone="destructive"
      onConfirm={() => onDelete(job)}
    />
  );

  if (variant === 'row') {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-muted/40">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <ToolIcon icon={tool.icon} category={tool.category} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="truncate text-caption text-muted-foreground">{meta}</p>
        </div>
        <StatusBadge status={expired ? 'expired' : displayJobStatus(job.state)} className="hidden sm:inline-flex" />
        <span className="hidden w-28 shrink-0 text-right text-caption text-muted-foreground md:inline">
          {format(job.updatedAt, 'd MMM, p')}
        </span>
        {actions}
        {confirm}
      </div>
    );
  }

  return (
    <Card className="group flex flex-col p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-2">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg bg-muted')}>
          <ToolIcon icon={tool.icon} category={tool.category} aria-hidden />
        </div>
        {actions}
      </div>
      <p className="mt-3 truncate text-sm font-medium" title={title}>
        {title}
      </p>
      <p className="truncate text-caption text-muted-foreground">{meta}</p>
      <div className="mt-3 flex items-center justify-between">
        <StatusBadge status={expired ? 'expired' : displayJobStatus(job.state)} />
        <span className="text-caption text-muted-foreground">{format(job.updatedAt, 'd MMM')}</span>
      </div>
      {confirm}
    </Card>
  );
}
