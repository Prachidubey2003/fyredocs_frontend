import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiJson, apiRequest } from '@/lib/apiClient';
import { type ApiJob, mapApiJob } from '@/lib/jobMapper';
import { buildJobPath, getToolIdByApiName } from '@/lib/toolApi';
import type { Job, ToolId } from '@/types';

const HISTORY_QUERY_KEY = ['jobs', 'history'] as const;

/**
 * The backend responds with `{ success, message, data }` where `data` is an
 * array of ApiJob-shaped items (dual casing, includes toolType). Be defensive:
 * accept a bare array, `data` as the array, or the array nested one level
 * deeper under `data.jobs` / `data.history` / a top-level `jobs` key.
 */
const extractApiJobs = (payload: unknown): ApiJob[] => {
  if (Array.isArray(payload)) return payload as ApiJob[];
  if (!payload || typeof payload !== 'object') return [];

  const envelope = payload as { data?: unknown; jobs?: unknown };
  for (const candidate of [envelope.data, envelope.jobs]) {
    if (Array.isArray(candidate)) return candidate as ApiJob[];
    if (candidate && typeof candidate === 'object') {
      const nested = candidate as { jobs?: unknown; history?: unknown };
      if (Array.isArray(nested.jobs)) return nested.jobs as ApiJob[];
      if (Array.isArray(nested.history)) return nested.history as ApiJob[];
    }
  }
  return [];
};

const fetchJobHistory = async (): Promise<Job[]> => {
  const payload = await apiJson<unknown>('/api/jobs/history');
  return extractApiJobs(payload).flatMap((apiJob) => {
    const toolType = apiJob.toolType ?? apiJob.ToolType;
    const toolId = toolType ? getToolIdByApiName(toolType) : undefined;
    // Skip jobs from tool types this frontend doesn't know about.
    if (!toolId) return [];
    return [mapApiJob(apiJob, toolId, [], {})];
  });
};

export const useJobHistory = () => {
  const query = useQuery({
    queryKey: HISTORY_QUERY_KEY,
    queryFn: fetchJobHistory,
    staleTime: 30 * 1000,
  });

  return {
    jobs: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
};

export interface DeleteJobVariables {
  toolId: ToolId;
  jobId: string;
}

/** Delete a history job with optimistic cache removal + rollback on error. */
export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ toolId, jobId }: DeleteJobVariables) =>
      apiRequest<unknown>(buildJobPath(toolId, jobId), { method: 'DELETE' }),
    onMutate: async ({ jobId }) => {
      await queryClient.cancelQueries({ queryKey: HISTORY_QUERY_KEY });
      const previous = queryClient.getQueryData<Job[]>(HISTORY_QUERY_KEY);
      queryClient.setQueryData<Job[]>(HISTORY_QUERY_KEY, (jobs) =>
        (jobs ?? []).filter((job) => job.id !== jobId),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(HISTORY_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY });
    },
  });
};
