import { useState, useCallback, useRef, useEffect } from 'react';
import { Job, JobState, ToolId, ToolOptions } from '@/types';
import { apiJson, apiRequest, buildApiUrl } from '@/lib/apiClient';
import { buildDownloadPath, buildJobPath } from '@/lib/toolApi';

interface UseJobOptions {
  pollingInterval?: number;
  maxPollingAttempts?: number;
  onComplete?: (job: Job) => void;
  onError?: (error: string) => void;
}

interface UseJobReturn {
  job: Job | null;
  createJob: (toolId: ToolId, fileIds: string[], options: ToolOptions) => void;
  cancelJob: () => void;
  retryJob: () => void;
  resetJob: () => void;
  isPolling: boolean;
}

interface ApiJob {
  id?: string;
  ID?: string;
  status?: string;
  Status?: string;
  progress?: number | string;
  Progress?: number | string;
  fileName?: string;
  FileName?: string;
  fileSize?: number | string;
  FileSize?: number | string;
  failureReason?: string;
  FailureReason?: string;
  createdAt?: string;
  CreatedAt?: string;
  updatedAt?: string;
  UpdatedAt?: string;
  completedAt?: string | null;
  CompletedAt?: string | null;
  expiresAt?: string | null;
  ExpiresAt?: string | null;
}

const parseDate = (value: unknown, fallback: Date) => {
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

const parseFileSize = (value: unknown) => {
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

const mapStatus = (status?: string): JobState => {
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

const parseProgress = (value: unknown, state: JobState) => {
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

const normalizeOptions = (toolId: ToolId, options: ToolOptions) => {
  if (!options) return undefined;

  switch (toolId) {
    case 'split': {
      const range = (options as { range?: string }).range?.trim();
      if (!range) {
        throw new Error('Page range is required for split.');
      }
      return { range };
    }
    case 'reorder': {
      const order = (options as { order?: string }).order?.trim();
      if (!order) {
        throw new Error('Page order is required for reorder.');
      }
      return { order };
    }
    case 'remove-pages':
    case 'extract-pages': {
      const pages = (options as { pages?: string }).pages?.trim();
      if (!pages) {
        throw new Error('Page selection is required.');
      }
      return { pages };
    }
    case 'compress': {
      const quality = (options as { quality?: string }).quality || 'ebook';
      return { quality };
    }
    case 'ocr': {
      const opts = options as { language?: string; dpi?: string };
      return {
        language: opts.language || 'eng',
        dpi: opts.dpi || '300',
      };
    }
    case 'scan-to-pdf': {
      const ocr = (options as { ocr?: boolean }).ocr;
      return ocr ? { ocr: true } : undefined;
    }
    case 'password-protect': {
      const password = (options as { password?: string }).password;
      if (!password) {
        throw new Error('Password is required.');
      }
      return { password };
    }
    // Tools with no options
    case 'merge':
    case 'repair-pdf':
    case 'pdf-to-word':
    case 'pdf-to-excel':
    case 'pdf-to-image':
    case 'pdf-to-ppt':
    case 'pdf-to-html':
    case 'pdf-to-text':
    case 'pdf-to-pdfa':
    case 'word-to-pdf':
    case 'excel-to-pdf':
    case 'image-to-pdf':
    case 'powerpoint-to-pdf':
    case 'html-to-pdf':
      return undefined;
    default:
      return options as Record<string, unknown>;
  }
};

const mapApiJob = (
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
      : state === 'processing'
      ? Math.max(1, Math.floor((progressValue / 100) * totalSteps))
      : 0;
  const currentStep =
    state === 'queued'
      ? 'Queued'
      : state === 'processing'
      ? 'Processing'
      : state === 'completed'
      ? 'Completed'
      : state === 'failed'
      ? 'Failed'
      : 'Pending';

  const fileName = apiJob.fileName ?? apiJob.FileName ?? 'output.pdf';
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
              apiJob.failureReason ??
              apiJob.FailureReason ??
              'The job failed to complete.',
            isRetryable: true,
          }
        : undefined,
    fileIds,
    options,
  };
};

export const useJob = ({
  pollingInterval = 2000,
  maxPollingAttempts = 300,
  onComplete,
  onError,
}: UseJobOptions = {}): UseJobReturn => {
  const [job, setJob] = useState<Job | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  const lastJobRef = useRef<{
    toolId: ToolId;
    fileIds: string[];
    options: ToolOptions;
  } | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    setIsPolling(false);
    attemptsRef.current = 0;
  }, []);

  const startPolling = useCallback(
    (toolId: ToolId, jobId: string, fileIds: string[], options: ToolOptions) => {
      stopPolling();
      setIsPolling(true);

      const poll = async () => {
        try {
          const apiJob = await apiRequest<ApiJob>(buildJobPath(toolId, jobId));
          const mappedJob = mapApiJob(apiJob, toolId, fileIds, options);
          setJob(mappedJob);

          if (mappedJob.state === 'completed') {
            stopPolling();
            onComplete?.(mappedJob);
            return;
          }

          if (mappedJob.state === 'failed') {
            stopPolling();
            onError?.(mappedJob.error?.message ?? 'The job failed to complete.');
            return;
          }

          attemptsRef.current = 0;
        } catch (error) {
          attemptsRef.current += 1;
          if (attemptsRef.current >= maxPollingAttempts) {
            const message =
              error instanceof Error ? error.message : 'Failed to poll job status.';
            setJob((prev) =>
              prev
                ? {
                    ...prev,
                    state: 'failed',
                    error: {
                      code: 'POLLING_FAILED',
                      message,
                      isRetryable: true,
                    },
                  }
                : prev
            );
            stopPolling();
            onError?.(message);
            return;
          }
        }

        pollingTimerRef.current = setTimeout(poll, pollingInterval);
      };

      void poll();
    },
    [maxPollingAttempts, onComplete, onError, pollingInterval, stopPolling]
  );

  const createJob = useCallback(
    (toolId: ToolId, fileIds: string[], options: ToolOptions) => {
      stopPolling();
      const normalizedIds = fileIds.filter(Boolean);

      if (normalizedIds.length === 0) {
        onError?.('No uploaded files available.');
        return;
      }

      lastJobRef.current = { toolId, fileIds: normalizedIds, options };

      const pendingJob: Job = {
        id: `job-${Date.now()}`,
        toolId,
        state: 'pending',
        progress: {
          currentStep: 'Submitting job',
          totalSteps: 3,
          completedSteps: 0,
          percentage: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        fileIds: normalizedIds,
        options,
      };

      setJob(pendingJob);
      setIsPolling(true);

      void (async () => {
        try {
          const payload: {
            uploadId?: string;
            uploadIds?: string[];
            options?: Record<string, unknown>;
          } = normalizedIds.length > 1 ? { uploadIds: normalizedIds } : { uploadId: normalizedIds[0] };

          const normalizedOptions = normalizeOptions(toolId, options);
          if (normalizedOptions && Object.keys(normalizedOptions).length > 0) {
            payload.options = normalizedOptions;
          }

          const apiJob = await apiJson<ApiJob>(buildJobPath(toolId), {
            method: 'POST',
            body: JSON.stringify(payload),
          });

          const mappedJob = mapApiJob(apiJob, toolId, normalizedIds, options);
          setJob(mappedJob);
          startPolling(toolId, mappedJob.id, normalizedIds, options);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to create job.';
          setJob({
            ...pendingJob,
            state: 'failed',
            error: {
              code: 'CREATE_FAILED',
              message,
              isRetryable: true,
            },
          });
          setIsPolling(false);
          onError?.(message);
        }
      })();
    },
    [onError, startPolling, stopPolling]
  );

  const cancelJob = useCallback(() => {
    if (!job) return;
    stopPolling();
    void apiRequest(buildJobPath(job.toolId, job.id), { method: 'DELETE' }).catch(() => undefined);
    setJob({
      ...job,
      state: 'failed',
      error: {
        code: 'CANCELLED',
        message: 'Job was cancelled by user',
        isRetryable: true,
      },
    });
  }, [job, stopPolling]);

  const retryJob = useCallback(() => {
    if (lastJobRef.current) {
      createJob(
        lastJobRef.current.toolId,
        lastJobRef.current.fileIds,
        lastJobRef.current.options
      );
    }
  }, [createJob]);

  const resetJob = useCallback(() => {
    stopPolling();
    setJob(null);
  }, [stopPolling]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    job,
    createJob,
    cancelJob,
    retryJob,
    resetJob,
    isPolling,
  };
};
