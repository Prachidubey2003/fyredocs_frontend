import { Job, JobState, ToolId, ToolOptions } from '@/types';
import { buildApiUrl } from '@/lib/apiClient';
import { buildDownloadPath } from '@/lib/toolApi';
import { friendlyError } from '@/lib/friendlyError';

/**
 * Shared mapping from the backend's job payloads (dual-cased fields) to the
 * frontend Job shape. Used by useJob (live jobs) and useJobHistory (My Files).
 */

export interface ApiJob {
  id?: string;
  ID?: string;
  status?: string;
  Status?: string;
  progress?: number | string;
  Progress?: number | string;
  fileName?: string;
  FileName?: string;
  outputFileName?: string;
  OutputFileName?: string;
  fileSize?: number | string;
  FileSize?: number | string;
  failureReason?: string;
  FailureReason?: string;
  toolType?: string;
  ToolType?: string;
  createdAt?: string;
  CreatedAt?: string;
  updatedAt?: string;
  UpdatedAt?: string;
  completedAt?: string | null;
  CompletedAt?: string | null;
  expiresAt?: string | null;
  ExpiresAt?: string | null;
}

export const parseDate = (value: unknown, fallback: Date) => {
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.valueOf())) {
      return parsed;
    }
  }
  if (value instanceof Date) {
    return value;
  }
  return fallback;
};

export const parseFileSize = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;

  const match = value.trim().toUpperCase().match(/([\d.]+)\s*(B|KB|MB|GB)/);
  if (!match) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  };

  return Math.round(amount * (multipliers[unit] ?? 1));
};

export const mapStatus = (status?: string): JobState => {
  switch (status?.toLowerCase()) {
    case 'queued':
      return 'queued';
    case 'processing':
      return 'processing';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    default:
      return 'pending';
  }
};

/**
 * Maps a job state to its user-facing display status. The backend queue is an
 * implementation detail: pending/queued jobs are presented as "processing".
 */
export const displayJobStatus = (
  state: JobState,
): 'processing' | 'completed' | 'failed' => {
  switch (state) {
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    default:
      return 'processing';
  }
};

export const parseProgress = (value: unknown, state: JobState) => {
  if (typeof value === 'number') {
    return Math.min(100, Math.max(0, value));
  }
  if (typeof value === 'string') {
    const parsed = Number(value.replace('%', '').trim());
    if (!Number.isNaN(parsed)) {
      return Math.min(100, Math.max(0, parsed));
    }
  }
  return state === 'completed' ? 100 : 0;
};

export const mapApiJob = (
  apiJob: ApiJob,
  toolId: ToolId,
  fileIds: string[],
  options: ToolOptions
): Job => {
  const fallbackTime = new Date();
  const id = apiJob.id ?? apiJob.ID ?? `job-${Date.now()}`;
  const status = apiJob.status ?? apiJob.Status ?? 'queued';
  const state = mapStatus(status);
  const progressValue = parseProgress(apiJob.progress ?? apiJob.Progress, state);
  const totalSteps = 3;
  const completedSteps =
    state === 'completed'
      ? totalSteps
      : progressValue > 0
      ? Math.max(1, Math.floor((progressValue / 100) * totalSteps))
      : 0;
  // User-facing label: queued/pending are backend implementation details —
  // anything in flight reads as "Processing".
  const currentStep =
    state === 'completed' ? 'Completed' : state === 'failed' ? 'Failed' : 'Processing';

  const fileName = apiJob.outputFileName ?? apiJob.OutputFileName ?? apiJob.fileName ?? apiJob.FileName ?? 'output.pdf';
  const fileSize = parseFileSize(apiJob.fileSize ?? apiJob.FileSize);
  const downloadUrl = buildApiUrl(buildDownloadPath(toolId, id));

  const createdAt = parseDate(apiJob.createdAt ?? apiJob.CreatedAt, fallbackTime);
  const updatedAt = parseDate(apiJob.updatedAt ?? apiJob.UpdatedAt, fallbackTime);
  const completedAt =
    state === 'completed'
      ? parseDate(apiJob.completedAt ?? apiJob.CompletedAt, updatedAt)
      : undefined;
  const expiresAt = parseDate(apiJob.expiresAt ?? apiJob.ExpiresAt, updatedAt);

  return {
    id,
    toolId,
    state,
    progress: {
      currentStep,
      totalSteps,
      completedSteps,
      percentage: state === 'completed' ? 100 : progressValue,
    },
    createdAt,
    updatedAt,
    completedAt,
    result:
      state === 'completed'
        ? {
            downloadUrl,
            fileName,
            fileSize,
            expiresAt,
          }
        : undefined,
    error:
      state === 'failed'
        ? {
            code: 'FAILED',
            message:
              friendlyError(apiJob.failureReason ?? apiJob.FailureReason) ??
              'The job failed to complete.',
            isRetryable: true,
          }
        : undefined,
    fileIds,
    options,
  };
};
