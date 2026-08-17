import { useState, useCallback, useRef, useEffect } from 'react';
import { Job, JobState, ToolId, ToolOptions } from '@/types';
import { apiJson, apiRequest, buildApiUrl } from '@/lib/apiClient';
import { buildDownloadPath, buildJobPath } from '@/lib/toolApi';
import { setGuestToken } from '@/lib/guestToken';
import { track } from '@/lib/activity';
import { ACTIVITY_EVENTS, ActivityStatus } from '@/lib/activityEvents';

export interface BatchJob {
  id: string;
  fileName: string;
  fileId: string;
  job: Job | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

interface UseBatchJobOptions {
  pollingInterval?: number;
  maxPollingAttempts?: number;
  onAllComplete?: (jobs: BatchJob[]) => void;
  onJobComplete?: (job: BatchJob) => void;
  onJobError?: (job: BatchJob, error: string) => void;
}

interface UseBatchJobReturn {
  batchJobs: BatchJob[];
  startBatch: (
    toolId: ToolId,
    files: Array<{ id: string; name: string; serverFileId: string }>,
    options: ToolOptions
  ) => void;
  cancelBatch: () => void;
  retryFailed: () => void;
  resetBatch: () => void;
  isProcessing: boolean;
  completedCount: number;
  failedCount: number;
  totalCount: number;
  overallProgress: number;
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
  outputFileName?: string;
  OutputFileName?: string;
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

export const useBatchJob = ({
  pollingInterval = 2000,
  maxPollingAttempts = 300,
  onAllComplete,
  onJobComplete,
  onJobError,
}: UseBatchJobOptions = {}): UseBatchJobReturn => {
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const pollingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const sseConnectionsRef = useRef<Map<string, EventSource>>(new Map());
  const sseTerminalJobsRef = useRef<Set<string>>(new Set());
  // NOTE: mirrors trackedTerminalRef in useJob.ts — SSE and the polling
  // fallback can both observe the same terminal state, but each server job
  // must emit exactly one terminal activity event. Keyed by server jobId.
  const trackedTerminalJobsRef = useRef<Set<string>>(new Set());

  const trackBatchTerminal = useCallback(
    (
      jobId: string,
      toolId: ToolId,
      status: Extract<ActivityStatus, 'success' | 'failed' | 'cancelled'>,
      extra?: { failureReason?: string; errorCode?: string }
    ) => {
      if (trackedTerminalJobsRef.current.has(jobId)) return;
      trackedTerminalJobsRef.current.add(jobId);
      const eventType =
        status === 'success'
          ? ACTIVITY_EVENTS.jobCompleted
          : status === 'cancelled'
          ? ACTIVITY_EVENTS.jobCancelled
          : ACTIVITY_EVENTS.jobFailed;
      track({
        eventType,
        status,
        toolId,
        correlationId: jobId,
        metadata: { batch: true },
        ...extra,
      });
    },
    []
  );
  const attemptsRef = useRef<Map<string, number>>(new Map());
  const lastBatchRef = useRef<{
    toolId: ToolId;
    files: Array<{ id: string; name: string; serverFileId: string }>;
    options: ToolOptions;
  } | null>(null);

  const stopPolling = useCallback((batchId?: string) => {
    if (batchId) {
      const timer = pollingTimersRef.current.get(batchId);
      if (timer) {
        clearTimeout(timer);
        pollingTimersRef.current.delete(batchId);
      }
      const es = sseConnectionsRef.current.get(batchId);
      if (es) {
        es.close();
        sseConnectionsRef.current.delete(batchId);
      }
      attemptsRef.current.delete(batchId);
    } else {
      pollingTimersRef.current.forEach((timer) => clearTimeout(timer));
      pollingTimersRef.current.clear();
      sseConnectionsRef.current.forEach((es) => es.close());
      sseConnectionsRef.current.clear();
      attemptsRef.current.clear();
    }
  }, []);

  const checkAllComplete = useCallback(() => {
    setBatchJobs((current) => {
      const allDone = current.every(
        (bj) => bj.status === 'completed' || bj.status === 'failed'
      );
      if (allDone && current.length > 0) {
        setIsProcessing(false);
        onAllComplete?.(current);
      }
      return current;
    });
  }, [onAllComplete]);

  const startPolling = useCallback(
    (batchId: string, toolId: ToolId, jobId: string, fileId: string, options: ToolOptions) => {
      const poll = async () => {
        try {
          const apiResponse = await apiRequest<{ data: ApiJob }>(buildJobPath(toolId, jobId));
          const mappedJob = mapApiJob(apiResponse.data, toolId, [fileId], options);

          setBatchJobs((prev) =>
            prev.map((bj) =>
              bj.id === batchId
                ? {
                    ...bj,
                    job: mappedJob,
                    status:
                      mappedJob.state === 'completed'
                        ? 'completed'
                        : mappedJob.state === 'failed'
                        ? 'failed'
                        : 'processing',
                    error: mappedJob.error?.message,
                  }
                : bj
            )
          );

          if (mappedJob.state === 'completed') {
            stopPolling(batchId);
            trackBatchTerminal(jobId, toolId, 'success');
            setBatchJobs((prev) => {
              const updated = prev.find((bj) => bj.id === batchId);
              if (updated) onJobComplete?.({ ...updated, job: mappedJob, status: 'completed' });
              return prev;
            });
            checkAllComplete();
            return;
          }

          if (mappedJob.state === 'failed') {
            stopPolling(batchId);
            trackBatchTerminal(jobId, toolId, 'failed', {
              failureReason: mappedJob.error?.message,
            });
            const errorMsg = mappedJob.error?.message ?? 'Job failed';
            setBatchJobs((prev) => {
              const updated = prev.find((bj) => bj.id === batchId);
              if (updated) onJobError?.({ ...updated, job: mappedJob, status: 'failed' }, errorMsg);
              return prev;
            });
            checkAllComplete();
            return;
          }

          attemptsRef.current.set(batchId, 0);
        } catch (error) {
          const currentAttempts = (attemptsRef.current.get(batchId) ?? 0) + 1;
          attemptsRef.current.set(batchId, currentAttempts);

          if (currentAttempts >= maxPollingAttempts) {
            const message = error instanceof Error ? error.message : 'Polling failed';
            trackBatchTerminal(jobId, toolId, 'failed', {
              failureReason: message,
              errorCode: 'POLLING_FAILED',
            });
            setBatchJobs((prev) =>
              prev.map((bj) =>
                bj.id === batchId
                  ? { ...bj, status: 'failed', error: message }
                  : bj
              )
            );
            stopPolling(batchId);
            checkAllComplete();
            return;
          }
        }

        pollingTimersRef.current.set(batchId, setTimeout(poll, pollingInterval));
      };

      void poll();
    },
    [checkAllComplete, maxPollingAttempts, onJobComplete, onJobError, pollingInterval, stopPolling, trackBatchTerminal]
  );

  const startSSEForJob = useCallback(
    (batchId: string, toolId: ToolId, jobId: string, fileId: string, options: ToolOptions) => {
      const url = buildApiUrl(`/api/jobs/${jobId}/events`);
      const es = new EventSource(url, { withCredentials: true });
      sseConnectionsRef.current.set(batchId, es);

      const eventToStatus = (eventType: string): string => {
        switch (eventType) {
          case 'JobCompleted':
            return 'completed';
          case 'JobFailed':
            return 'failed';
          case 'JobQueued':
            return 'queued';
          default:
            return 'processing';
        }
      };

      es.addEventListener('job-update', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as {
            jobId: string;
            status: string;
            progress: number;
            toolType: string;
            fileSize?: number;
          };

          const status = eventToStatus(data.status);
          const state = mapStatus(status);
          const progress = data.progress ?? 0;

          setBatchJobs((prev) =>
            prev.map((bj) => {
              if (bj.id !== batchId) return bj;
              const prevJob = bj.job;
              if (!prevJob) return bj;

              const pct = state === 'completed' ? 100 : progress;
              const totalSteps = 3;
              const completedSteps =
                state === 'completed'
                  ? totalSteps
                  : pct > 0
                  ? Math.max(1, Math.floor((pct / 100) * totalSteps))
                  : prevJob.progress.completedSteps;

              return {
                ...bj,
                job: {
                  ...prevJob,
                  state,
                  progress: {
                    ...prevJob.progress,
                    completedSteps,
                    percentage: pct,
                    currentStep: state === 'completed' ? 'Completed' : state === 'failed' ? 'Failed' : 'Processing',
                  },
                  updatedAt: new Date(),
                },
                status: state === 'completed' ? 'completed' : state === 'failed' ? 'failed' : 'processing',
                error: state === 'failed' ? 'The job failed to complete.' : bj.error,
              };
            })
          );

          if (status === 'completed') {
            sseTerminalJobsRef.current.add(batchId);
            stopPolling(batchId);
            trackBatchTerminal(jobId, toolId, 'success');
            setBatchJobs((prev) => {
              const updated = prev.find((bj) => bj.id === batchId);
              if (updated) onJobComplete?.({ ...updated, status: 'completed' });
              return prev;
            });
            checkAllComplete();
            return;
          }

          if (status === 'failed') {
            sseTerminalJobsRef.current.add(batchId);
            stopPolling(batchId);
            trackBatchTerminal(jobId, toolId, 'failed', {
              failureReason: 'The job failed to complete.',
            });
            const errorMsg = 'The job failed to complete.';
            setBatchJobs((prev) => {
              const updated = prev.find((bj) => bj.id === batchId);
              if (updated) onJobError?.({ ...updated, status: 'failed' }, errorMsg);
              return prev;
            });
            checkAllComplete();
            return;
          }
        } catch {
          // Ignore malformed SSE data
        }
      });

      es.addEventListener('done', () => {
        const conn = sseConnectionsRef.current.get(batchId);
        if (conn) {
          conn.close();
          sseConnectionsRef.current.delete(batchId);
        }
      });

      es.onerror = () => {
        // If connection was already cleaned up by `done` handler or `stopPolling`, don't poll.
        if (!sseConnectionsRef.current.has(batchId)) return;
        const conn = sseConnectionsRef.current.get(batchId);
        if (conn) {
          conn.close();
          sseConnectionsRef.current.delete(batchId);
        }
        if (!sseTerminalJobsRef.current.has(batchId)) {
          startPolling(batchId, toolId, jobId, fileId, options);
        }
      };
    },
    [checkAllComplete, onJobComplete, onJobError, startPolling, stopPolling, trackBatchTerminal]
  );

  const processFile = useCallback(
    async (
      batchId: string,
      toolId: ToolId,
      fileId: string,
      serverFileId: string,
      options: ToolOptions
    ) => {
      try {
        const payload: { uploadId: string; options?: Record<string, unknown> } = {
          uploadId: serverFileId,
        };

        if (options && Object.keys(options).length > 0) {
          payload.options = options as Record<string, unknown>;
        }

        const apiResponse = await apiJson<{ data: ApiJob & { guestToken?: string } }>(buildJobPath(toolId), {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (apiResponse.data.guestToken) {
          setGuestToken(apiResponse.data.guestToken);
        }

        const mappedJob = mapApiJob(apiResponse.data, toolId, [serverFileId], options);
        track({
          eventType: ACTIVITY_EVENTS.jobStarted,
          status: 'started',
          toolId,
          correlationId: mappedJob.id,
          metadata: { batch: true },
        });

        setBatchJobs((prev) =>
          prev.map((bj) =>
            bj.id === batchId
              ? { ...bj, job: mappedJob, status: 'processing' }
              : bj
          )
        );

        startSSEForJob(batchId, toolId, mappedJob.id, serverFileId, options);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create job';
        // No server job id exists on a create failure, so no correlationId.
        track({
          eventType: ACTIVITY_EVENTS.jobFailed,
          status: 'failed',
          toolId,
          failureReason: message,
          errorCode: 'CREATE_FAILED',
          metadata: { batch: true },
        });
        setBatchJobs((prev) =>
          prev.map((bj) =>
            bj.id === batchId
              ? { ...bj, status: 'failed', error: message }
              : bj
          )
        );
        checkAllComplete();
      }
    },
    [checkAllComplete, startSSEForJob]
  );

  const startBatch = useCallback(
    (
      toolId: ToolId,
      files: Array<{ id: string; name: string; serverFileId: string }>,
      options: ToolOptions
    ) => {
      stopPolling();
      lastBatchRef.current = { toolId, files, options };

      const initialBatchJobs: BatchJob[] = files.map((file) => ({
        id: `batch-${file.id}-${Date.now()}`,
        fileName: file.name,
        fileId: file.serverFileId,
        job: null,
        status: 'pending',
      }));

      setBatchJobs(initialBatchJobs);
      setIsProcessing(true);

      // Start processing each file
      initialBatchJobs.forEach((batchJob, index) => {
        const file = files[index];
        void processFile(batchJob.id, toolId, file.id, file.serverFileId, options);
      });
    },
    [processFile, stopPolling]
  );

  const cancelBatch = useCallback(() => {
    stopPolling();
    setBatchJobs((prev) =>
      prev.map((bj) =>
        bj.status === 'processing' || bj.status === 'pending'
          ? { ...bj, status: 'failed', error: 'Cancelled by user' }
          : bj
      )
    );
    setIsProcessing(false);
  }, [stopPolling]);

  const retryFailed = useCallback(() => {
    if (!lastBatchRef.current) return;

    const { toolId, files, options } = lastBatchRef.current;
    const failedFiles = batchJobs
      .filter((bj) => bj.status === 'failed')
      .map((bj) => files.find((f) => f.serverFileId === bj.fileId))
      .filter((f): f is NonNullable<typeof f> => Boolean(f));

    if (failedFiles.length === 0) return;

    setBatchJobs((prev) =>
      prev.map((bj) =>
        bj.status === 'failed'
          ? { ...bj, status: 'pending', error: undefined, job: null }
          : bj
      )
    );

    setIsProcessing(true);

    batchJobs
      .filter((bj) => bj.status === 'failed')
      .forEach((bj) => {
        const file = files.find((f) => f.serverFileId === bj.fileId);
        if (file) {
          void processFile(bj.id, toolId, file.id, file.serverFileId, options);
        }
      });
  }, [batchJobs, processFile]);

  const resetBatch = useCallback(() => {
    stopPolling();
    setBatchJobs([]);
    setIsProcessing(false);
    lastBatchRef.current = null;
  }, [stopPolling]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const completedCount = batchJobs.filter((bj) => bj.status === 'completed').length;
  const failedCount = batchJobs.filter((bj) => bj.status === 'failed').length;
  const totalCount = batchJobs.length;

  const overallProgress =
    totalCount > 0
      ? Math.round(
          batchJobs.reduce((sum, bj) => {
            if (bj.status === 'completed') return sum + 100;
            if (bj.status === 'failed') return sum + 100;
            return sum + (bj.job?.progress.percentage ?? 0);
          }, 0) / totalCount
        )
      : 0;

  return {
    batchJobs,
    startBatch,
    cancelBatch,
    retryFailed,
    resetBatch,
    isProcessing,
    completedCount,
    failedCount,
    totalCount,
    overallProgress,
  };
};
