import { apiRequest } from '@/lib/apiClient';

export type OverviewData = {
  date: string;
  signups: number;
  logins: number;
  dau: number;
  guestSessions: number;
  jobsCreated: number;
  jobsCompleted: number;
  jobsFailed: number;
  planLimitHits: number;
};

export type DailyRow = { date: string; eventType: string; count: number };
export type UserGrowthRow = { date: string; signups: number; dau: number };
export type ToolUsageRow = { toolType: string; count: number; completed: number; failed: number };
export type PlanRow = { planName: string; users: number; jobs: number; limitHits: number };
export type RealtimeRow = { eventType: string; count: number };

type ApiResponse<T> = { success: boolean; message: string; data: T };

export const fetchOverview = () =>
  apiRequest<ApiResponse<OverviewData>>('/admin/metrics/overview');

export const fetchDaily = (from: string, to: string) =>
  apiRequest<ApiResponse<{ from: string; to: string; rows: DailyRow[] }>>(
    `/admin/metrics/daily?from=${from}&to=${to}`
  );

export const fetchUserGrowth = (days = 90) =>
  apiRequest<ApiResponse<{ days: number; rows: UserGrowthRow[] }>>(
    `/admin/metrics/users?days=${days}`
  );

export const fetchToolUsage = (days = 30) =>
  apiRequest<ApiResponse<{ days: number; rows: ToolUsageRow[] }>>(
    `/admin/metrics/tools?days=${days}`
  );

export const fetchPlanDistribution = (days = 30) =>
  apiRequest<ApiResponse<{ days: number; rows: PlanRow[] }>>(
    `/admin/metrics/plans?days=${days}`
  );

export const fetchRealtime = () =>
  apiRequest<ApiResponse<{ since: string; rows: RealtimeRow[] }>>(
    '/admin/metrics/realtime'
  );
