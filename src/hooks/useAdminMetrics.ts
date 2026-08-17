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
  fetchServerPerformance,
  fetchApiPerformance,
  fetchAdminActivity,
  type EndpointQueryParams,
  type AdminActivityParams,
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
    refetchInterval: 30_000,
  });

export const useServerPerformance = () =>
  useQuery({
    queryKey: ['admin', 'serverPerformance'],
    queryFn: fetchServerPerformance,
    refetchInterval: 10_000,
  });

export const useApiPerformance = (params?: EndpointQueryParams) =>
  useQuery({
    queryKey: ['admin', 'apiPerformance', params],
    queryFn: () => fetchApiPerformance(params),
    staleTime: 60_000,
  });

export const useAdminActivity = (params?: AdminActivityParams) =>
  useQuery({
    queryKey: ['admin', 'activity', params],
    queryFn: () => fetchAdminActivity(params),
    staleTime: 30_000,
  });
