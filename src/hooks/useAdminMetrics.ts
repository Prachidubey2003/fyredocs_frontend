import { useQuery } from '@tanstack/react-query';
import {
  fetchOverview,
  fetchUserGrowth,
  fetchToolUsage,
  fetchPlanDistribution,
  fetchRealtime,
  fetchBusiness,
  fetchGrowth,
  fetchEngagement,
  fetchReliability,
  fetchSystem,
  fetchNats,
  fetchServerPerformance,
  fetchApiPerformance,
  fetchExecutiveOverview,
  fetchRevenue,
  fetchAcquisition,
  fetchQueueStatus,
  fetchApiTrends,
  type EndpointQueryParams,
} from '@/lib/adminApi';

export const useOverview = () =>
  useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: fetchOverview,
    refetchInterval: 60_000,
  });

export const useUserGrowth = (days = 90) =>
  useQuery({
    queryKey: ['admin', 'userGrowth', days],
    queryFn: () => fetchUserGrowth(days),
    staleTime: 5 * 60_000,
  });

export const useToolUsage = (days = 30) =>
  useQuery({
    queryKey: ['admin', 'toolUsage', days],
    queryFn: () => fetchToolUsage(days),
    staleTime: 5 * 60_000,
  });

export const usePlanDistribution = (days = 30) =>
  useQuery({
    queryKey: ['admin', 'plans', days],
    queryFn: () => fetchPlanDistribution(days),
    staleTime: 5 * 60_000,
  });

export const useRealtime = () =>
  useQuery({
    queryKey: ['admin', 'realtime'],
    queryFn: fetchRealtime,
    refetchInterval: 15_000,
  });

export const useBusiness = (days = 30) =>
  useQuery({
    queryKey: ['admin', 'business', days],
    queryFn: () => fetchBusiness(days),
    staleTime: 5 * 60_000,
  });

export const useGrowth = (days = 30) =>
  useQuery({
    queryKey: ['admin', 'growth', days],
    queryFn: () => fetchGrowth(days),
    staleTime: 5 * 60_000,
  });

export const useEngagement = (days = 30) =>
  useQuery({
    queryKey: ['admin', 'engagement', days],
    queryFn: () => fetchEngagement(days),
    staleTime: 5 * 60_000,
  });

export const useReliability = (days = 30) =>
  useQuery({
    queryKey: ['admin', 'reliability', days],
    queryFn: () => fetchReliability(days),
    staleTime: 5 * 60_000,
  });

export const useSystem = () =>
  useQuery({
    queryKey: ['admin', 'system'],
    queryFn: fetchSystem,
    refetchInterval: 15_000,
  });

export const useNats = () =>
  useQuery({
    queryKey: ['admin', 'nats'],
    queryFn: fetchNats,
    // Near-realtime: the /varz + /jsz scrape is cheap and internal. React
    // Query pauses this while the tab is backgrounded (refetchIntervalInBackground
    // defaults to false), so it only polls when someone is watching.
    refetchInterval: 5_000,
  });

export const useServerPerformance = () =>
  useQuery({
    queryKey: ['admin', 'serverPerformance'],
    queryFn: fetchServerPerformance,
    refetchInterval: 15_000,
  });

export const useApiPerformance = (params?: EndpointQueryParams) =>
  useQuery({
    queryKey: ['admin', 'apiPerformance', params],
    queryFn: () => fetchApiPerformance(params),
    refetchInterval: 15_000,
    staleTime: 60_000,
  });

// --- Redesign endpoints (new, 404-tolerant) ---

export const useExecutiveOverview = (days = 30) =>
  useQuery({
    queryKey: ['admin', 'executive', days],
    queryFn: () => fetchExecutiveOverview(days),
    staleTime: 60_000,
  });

export const useRevenue = (days = 30) =>
  useQuery({
    queryKey: ['admin', 'revenue', days],
    queryFn: () => fetchRevenue(days),
    staleTime: 5 * 60_000,
  });

export const useAcquisition = (days = 30) =>
  useQuery({
    queryKey: ['admin', 'acquisition', days],
    queryFn: () => fetchAcquisition(days),
    staleTime: 5 * 60_000,
  });

export const useQueueStatus = () =>
  useQuery({
    queryKey: ['admin', 'queues'],
    queryFn: fetchQueueStatus,
    refetchInterval: 15_000,
  });

export const useApiTrends = (days = 7) =>
  useQuery({
    queryKey: ['admin', 'apiTrends', days],
    queryFn: () => fetchApiTrends(days),
    staleTime: 60_000,
  });
