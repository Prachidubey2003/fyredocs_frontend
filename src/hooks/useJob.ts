import { useState, useCallback, useRef, useEffect } from 'react';
import { Job, JobState, SplitOptions, WatermarkOptions, ToolId, ToolOptions } from '@/types';
import { apiJson, apiRequest, buildApiUrl } from '@/lib/apiClient';
import { buildDownloadPath, buildJobPath } from '@/lib/toolApi';
import { setGuestToken } from '@/lib/guestToken';
import { ApiJob, mapApiJob, mapStatus } from '@/lib/jobMapper';

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

export const normalizeOptions = (toolId: ToolId, options: ToolOptions) => {
  if (!options) return undefined;

  switch (toolId) {
    case 'split': {
      const opts = options as SplitOptions;
      if (opts.mode === 'range') {
        const range = opts.range?.trim();
        if (!range) {
          throw new Error('Page range is required for split.');
        }
        return { mode: 'range', range };
      }
      if (opts.mode === 'extract') {
        const span = opts.span;
        if (!span || span < 1) {
          throw new Error('Page count per chunk is required for extract.');
        }
        return { mode: 'extract', range: String(span) };
      }
      if (opts.mode === 'equal') {
        const span = opts.span;
        if (!span || span < 2) {
          throw new Error('Number of parts is required for equal split.');
        }
        return { mode: 'equal', range: String(span) };
      }
      return { mode: 'all', range: 'all' };
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
        ...(opts.dpi ? { dpi: opts.dpi } : {}),
      };
    }
    case 'scan-to-pdf': {
      const opts = options as { ocr?: boolean; language?: string };
      if (!opts.ocr) return undefined;
      return { ocr: true, ...(opts.language ? { language: opts.language } : {}) };
    }
    case 'password-protect': {
      const password = (options as { password?: string }).password;
      if (!password) {
        throw new Error('Password is required.');
      }
      return { password };
    }
    case 'rotate': {
      const opts = options as { rotation?: number; applyToPages?: string };
      if (!opts.rotation) {
        throw new Error('Rotation angle is required.');
      }
      return { rotation: opts.rotation, applyToPages: opts.applyToPages || 'all' };
    }
    case 'watermark': {
      const opts = options as WatermarkOptions;
      if (opts.type === 'text' && !opts.text?.trim()) {
        throw new Error('Watermark text is required.');
      }
      if (opts.type === 'image' && !opts.imageData) {
        throw new Error('Watermark image is required.');
      }
      return {
        type: opts.type,
        ...(opts.type === 'text' ? { text: opts.text, fontSize: opts.fontSize, color: opts.color } : {}),
        ...(opts.type === 'image' ? { imageData: opts.imageData, scale: opts.scale } : {}),
        position: opts.position,
        opacity: opts.opacity,
      };
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

export const useJob = ({
  pollingInterval = 2000,
  maxPollingAttempts = 300,
  onComplete,
  onError,
}: UseJobOptions = {}): UseJobReturn => {
  const [job, setJob] = useState<Job | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const attemptsRef = useRef(0);
  const lastJobRef = useRef<{
    toolId: ToolId;
    fileIds: string[];
    options: ToolOptions;
  } | null>(null);
  const maxProgressRef = useRef(0);
  const sseTerminalRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
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
          const apiResponse = await apiRequest<{ data: ApiJob }>(buildJobPath(toolId, jobId));
          const mappedJob = mapApiJob(apiResponse.data, toolId, fileIds, options);

          // Enforce monotonic progress — never show regression to the user.
          if (mappedJob.state === 'failed') {
            maxProgressRef.current = 0;
          } else if (mappedJob.progress.percentage < maxProgressRef.current) {
            mappedJob.progress.percentage = maxProgressRef.current;
          } else {
            maxProgressRef.current = mappedJob.progress.percentage;
          }

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

  const startSSE = useCallback(
    (toolId: ToolId, jobId: string, fileIds: string[], options: ToolOptions) => {
      stopPolling();
      sseTerminalRef.current = false;
      setIsPolling(true);

      const url = buildApiUrl(`/api/jobs/${jobId}/events`);
      const es = new EventSource(url, { withCredentials: true });
      sseRef.current = es;

      es.addEventListener('job-update', async (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as {
            jobId: string;
            status: string;
            progress: number;
            toolType: string;
            fileSize?: number;
          };

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

          const status = eventToStatus(data.status);
          const state = mapStatus(status);
          const progress = data.progress ?? 0;

          setJob((prev) => {
            if (!prev) return prev;

            // Enforce monotonic progress
            let pct = progress;
            if (state === 'failed') {
              maxProgressRef.current = 0;
            } else if (pct < maxProgressRef.current) {
              pct = maxProgressRef.current;
            } else {
              maxProgressRef.current = pct;
            }

            const totalSteps = 3;
            const completedSteps =
              state === 'completed'
                ? totalSteps
                : pct > 0
                ? Math.max(1, Math.floor((pct / 100) * totalSteps))
                : prev.progress.completedSteps;
            // Queued/pending read as "Processing" — the queue is a backend detail.
            const currentStep =
              state === 'completed' ? 'Completed' : state === 'failed' ? 'Failed' : 'Processing';

            const downloadUrl = buildApiUrl(buildDownloadPath(toolId, prev.id));

            return {
              ...prev,
              state,
              progress: {
                currentStep,
                totalSteps,
                completedSteps,
                percentage: state === 'completed' ? 100 : pct,
              },
              updatedAt: new Date(),
              completedAt: state === 'completed' ? new Date() : prev.completedAt,
              result:
                state === 'completed'
                  ? {
                      downloadUrl,
                      fileName: prev.result?.fileName ?? 'output.pdf',
                      fileSize: data.fileSize || prev.result?.fileSize || 0,
                      expiresAt: prev.result?.expiresAt ?? new Date(),
                    }
                  : prev.result,
              error:
                state === 'failed'
                  ? {
                      code: 'FAILED',
                      message: 'The job failed to complete.',
                      isRetryable: true,
                    }
                  : prev.error,
            };
          });

          if (status === 'completed') {
            sseTerminalRef.current = true;
            maxProgressRef.current = 0;
            stopPolling();
            // Fetch full job data to get file metadata (size, name)
            try {
              const apiResponse = await apiRequest<{ data: ApiJob }>(buildJobPath(toolId, jobId));
              const finalJob = mapApiJob(apiResponse.data, toolId, fileIds, options);
              setJob(finalJob);
              onComplete?.(finalJob);
            } catch {
              // Fallback: use the SSE-derived state
              setJob((prev) => {
                if (prev) onComplete?.(prev);
                return prev;
              });
            }
            return;
          }

          if (status === 'failed') {
            sseTerminalRef.current = true;
            stopPolling();
            onError?.('The job failed to complete.');
            return;
          }
        } catch {
          // Ignore malformed SSE data
        }
      });

      es.addEventListener('done', () => {
        // Stream closed by server — job is in a terminal state.
        // Final state was already handled by the job-update listener above.
        if (sseRef.current) {
          sseRef.current.close();
          sseRef.current = null;
        }
      });

      es.onerror = () => {
        // If sseRef is already null, the connection was intentionally closed
        // by the `done` handler or `stopPolling()` — don't fall back to polling.
        if (!sseRef.current) return;
        sseRef.current.close();
        sseRef.current = null;
        if (!sseTerminalRef.current) {
          startPolling(toolId, jobId, fileIds, options);
        }
      };
    },
    [onComplete, onError, startPolling, stopPolling]
  );

  const createJob = useCallback(
    (toolId: ToolId, fileIds: string[], options: ToolOptions) => {
      stopPolling();
      maxProgressRef.current = 0;
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

          const apiResponse = await apiJson<{ data: ApiJob & { guestToken?: string } }>(buildJobPath(toolId), {
            method: 'POST',
            body: JSON.stringify(payload),
          });

          if (apiResponse.data.guestToken) {
            setGuestToken(apiResponse.data.guestToken);
          }

          const mappedJob = mapApiJob(apiResponse.data, toolId, normalizedIds, options);
          setJob(mappedJob);
          startSSE(toolId, mappedJob.id, normalizedIds, options);
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
    [onError, startSSE, stopPolling]
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
    maxProgressRef.current = 0;
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
