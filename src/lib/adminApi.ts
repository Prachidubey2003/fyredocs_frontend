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

// --- Business Metrics ---
export type BusinessData = {
  period: { from: string; to: string; days: number };
  signups: { total: number; daily: { date: string; signups: number }[] };
  planDistribution: { date: string; planName: string; users: number }[];
  planChanges: { date: string; oldPlan: string; newPlan: string; count: number }[];
  conversionRate: { totalChanges: number; freeUpgrades: number; rate: number };
  churn: { inactiveDays: number; churnedUsers: number; previousActiveUsers: number; churnRate: number };
  revenue: { mrr: number | null; arr: number | null; cac: number | null; ltv: number | null; note: string };
};

export const fetchBusiness = (days = 30) =>
  apiRequest<ApiResponse<BusinessData>>(`/admin/metrics/business?days=${days}`);

// --- Growth Metrics ---
export type GrowthData = {
  period: { from: string; to: string; days: number };
  dau: number;
  wau: number;
  mau: number;
  stickiness: number;
  dauTrend: { date: string; dau: number }[];
  activationRate: { signups: number; activated: number; rate: number };
  retention: { cohortDate: string; cohortSize: number; d1: number; d7: number; d30: number }[];
  funnel: { signedUp: number; createdJob: number; completedJob: number; repeatUser: number };
};

export const fetchGrowth = (days = 30) =>
  apiRequest<ApiResponse<GrowthData>>(`/admin/metrics/growth?days=${days}`);

// --- Engagement Metrics ---
export type EngagementData = {
  period: { from: string; to: string; days: number };
  toolTrends: { date: string; toolType: string; count: number }[];
  jobsPerUser: { average: number; median: number };
  fileSizeDistribution: { bucket: string; count: number }[];
  guestVsRegistered: { guestEvents: number; registeredEvents: number; uniqueRegistered: number; guestRatio: number };
  powerUsers: { userId: string; jobCount: number }[];
};

export const fetchEngagement = (days = 30) =>
  apiRequest<ApiResponse<EngagementData>>(`/admin/metrics/engagement?days=${days}`);

// --- Reliability Metrics ---
export type ReliabilityData = {
  period: { from: string; to: string; days: number };
  jobRate: { completed: number; failed: number; total: number; successRate: number };
  errorTrend: { date: string; failures: number; total: number }[];
  processingTime: { avgSeconds: number; p50Seconds: number; p95Seconds: number };
  toolErrors: { toolType: string; completed: number; failed: number }[];
  planLimitHits: { date: string; planName: string; hits: number }[];
};

export const fetchReliability = (days = 30) =>
  apiRequest<ApiResponse<ReliabilityData>>(`/admin/metrics/reliability?days=${days}`);

// --- System Health ---
export type SystemData = {
  timestamp: string;
  activeUsersNow: number;
  eventsLastHour: number;
  eventsLast24h: number;
  totalEvents: number;
  ingestionRate: { hour: string; count: number }[];
  processingLag: { avgSeconds: number; maxSeconds: number };
  eventsByType: { eventType: string; count: number }[];
};

export const fetchSystem = () =>
  apiRequest<ApiResponse<SystemData>>('/admin/metrics/system');

// --- Server Performance ---
export type ServerPerformanceData = {
  system: {
    uptime: string;
    cpu: { count: number; usagePercent: number; loadAvg1m: number; loadAvg5m: number; loadAvg15m: number };
    memory: { totalMB: number; usedMB: number; freeMB: number; availableMB: number; usagePercent: number };
    storage: { totalGB: number; usedGB: number; freeGB: number; usagePercent: number };
  };
  services: Record<string, {
    status: string;
    uptime?: string;
    goVersion?: string;
    goroutines?: number;
    error?: string;
    memory?: { heapAllocMB: number; heapInuseMB: number; stackInuseMB: number; sysMB: number; numGC?: number; gcPauseTotalMs?: number };
  }>;
  availability: { totalServices: number; healthyServices: number; unhealthyServices: number; uptimePercent: number };
};

export const fetchServerPerformance = () =>
  apiRequest<ApiResponse<ServerPerformanceData>>('/admin/metrics/server-performance');

// --- API Performance ---
export type ApiPerformanceEndpoint = {
  method: string;
  path: string;
  requests: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRate: number;
};

export type ApiPerformanceData = {
  summary: { totalRequests: number; avgLatencyMs: number; p50LatencyMs: number; p95LatencyMs: number; p99LatencyMs: number; errorRate: number };
  endpoints: ApiPerformanceEndpoint[];
  slowestEndpoints: ApiPerformanceEndpoint[];
  highestErrorEndpoints: ApiPerformanceEndpoint[];
};

export const fetchApiPerformance = () =>
  apiRequest<ApiResponse<ApiPerformanceData>>('/admin/metrics/api-performance');
