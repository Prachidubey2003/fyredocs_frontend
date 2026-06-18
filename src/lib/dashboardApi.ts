import { apiRequest } from '@/lib/apiClient';

/**
 * Unified, role-aware dashboard endpoint. The backend (analytics-service)
 * filters the payload server-side by role, so a single call serves both admins
 * and regular users. The returned `role` discriminates the shape.
 */

type ApiResponse<T> = { success: boolean; message: string; data: T };

export type DashboardPeriod = { days: number; from: string; to: string };

export type DashboardToolRow = {
  toolType: string;
  count: number;
  completed: number;
  failed: number;
};

export type AdminDashboardData = {
  role: 'admin';
  period: DashboardPeriod;
  today: {
    date: string;
    signups: number;
    logins: number;
    dau: number;
    guestSessions: number;
    jobsCreated: number;
    jobsCompleted: number;
    jobsFailed: number;
  };
  totalUsers: number;
  toolUsage: DashboardToolRow[];
  planDistribution: { planName: string; users: number; jobs: number }[];
};

export type UserDashboardData = {
  role: 'user';
  period: DashboardPeriod;
  jobs: { total: number; completed: number; failed: number };
  bytesProcessed: number;
  toolUsage: DashboardToolRow[];
  recentActivity: { date: string; count: number }[];
  plan: string;
  memberSince: string | null;
};

export type DashboardData = AdminDashboardData | UserDashboardData;

export const fetchDashboard = async (days = 30): Promise<DashboardData> => {
  const res = await apiRequest<ApiResponse<DashboardData>>(`/api/dashboard?days=${days}`);
  return res.data;
};
