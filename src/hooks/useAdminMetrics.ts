import { useQuery } from '@tanstack/react-query';
import {
  fetchOverview,
  fetchUserGrowth,
  fetchToolUsage,
  fetchPlanDistribution,
  fetchRealtime,
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
