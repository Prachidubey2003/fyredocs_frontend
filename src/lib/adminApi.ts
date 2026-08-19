import { apiRequest } from '@/lib/apiClient';

/**
 * Wraps a fetch for an endpoint that may not be deployed yet. Resolves to null
 * on any failure so the UI can render an "awaiting data" slot instead of an
 * error. Use only for the new redesign endpoints, not the established ones.
 */
const optional = async <T>(promise: Promise<ApiResponse<T>>): Promise<T | null> => {
  try {
    const res = await promise;
    return res.data;
  } catch {
    return null;
  }
};

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

export type PaginationMeta = { page: number; limit: number; total: number };
export type ApiResponseWithMeta<T> = { success: boolean; message: string; data: T; meta?: PaginationMeta };

const unwrap = async <T>(promise: Promise<ApiResponse<T>>): Promise<T> => {
  const res = await promise;
  return res.data;
};

export const fetchOverview = () =>
  unwrap(apiRequest<ApiResponse<OverviewData>>('/admin/metrics/overview'));

export const fetchDaily = (from: string, to: string) =>
  unwrap(apiRequest<ApiResponse<{ from: string; to: string; rows: DailyRow[] }>>(
    `/admin/metrics/daily?from=${from}&to=${to}`
  ));

export const fetchUserGrowth = (days = 90) =>
  unwrap(apiRequest<ApiResponse<{ days: number; rows: UserGrowthRow[] }>>(
    `/admin/metrics/users?days=${days}`
  ));

export const fetchToolUsage = (days = 30) =>
  unwrap(apiRequest<ApiResponse<{ days: number; rows: ToolUsageRow[] }>>(
    `/admin/metrics/tools?days=${days}`
  ));

export const fetchPlanDistribution = (days = 30) =>
  unwrap(apiRequest<ApiResponse<{ days: number; rows: PlanRow[] }>>(
    `/admin/metrics/plans?days=${days}`
  ));

export const fetchRealtime = () =>
  unwrap(apiRequest<ApiResponse<{ since: string; rows: RealtimeRow[] }>>(
    '/admin/metrics/realtime'
  ));

// --- Business Metrics ---
export type BusinessData = {
  period: { from: string; to: string; days: number };
  signups: { total: number; daily: { date: string; signups: number }[] };
  planDistribution: { date: string; planName: string; users: number }[];
  planChanges: { date: string; oldPlan: string; newPlan: string; count: number }[];
  conversionRate: { totalChanges: number; freeUpgrades: number; rate: number };
  churn: { inactiveDays: number; churnedUsers: number; previousActiveUsers: number; churnRate: number };
  revenue: {
    mrr: number | null;
    arr: number | null;
    cac: number | null;
    ltv: number | null;
    note: string;
    /** Set true once revenue is estimated from the plan-price map. */
    estimated?: boolean;
    currency?: string;
  };
};

export const fetchBusiness = (days = 30) =>
  unwrap(apiRequest<ApiResponse<BusinessData>>(`/admin/metrics/business?days=${days}`));

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
  /** DAU/WAU/MAU per day (new backend field). */
  activeTrend?: { date: string; dau: number; wau: number; mau: number }[];
  /** Previous-period DAU series for overlay comparison (new backend field). */
  previousDauTrend?: { date: string; dau: number }[];
};

export const fetchGrowth = (days = 30) =>
  unwrap(apiRequest<ApiResponse<GrowthData>>(`/admin/metrics/growth?days=${days}`));

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
  unwrap(apiRequest<ApiResponse<EngagementData>>(`/admin/metrics/engagement?days=${days}`));

// --- Reliability Metrics ---
export type ReliabilityData = {
  period: { from: string; to: string; days: number };
  jobRate: { completed: number; failed: number; total: number; successRate: number };
  errorTrend: { date: string; failures: number; total: number }[];
  processingTime: { avgSeconds: number; p50Seconds: number; p95Seconds: number };
  toolErrors: { toolType: string; completed: number; failed: number }[];
  planLimitHits: { date: string; planName: string; hits: number }[];
  /** Daily processing-time percentiles, seconds (new backend field). */
  processingTimeTrend?: { date: string; p50: number; p95: number; p99: number }[];
  /** Daily failure counts bucketed by root-cause category (new backend field). */
  failureCategories?: { date: string; category: string; count: number }[];
};

/** Failure-category buckets returned by the reliability endpoint. */
export const FAILURE_CATEGORIES = ['timeout', 'validation', 'processing', 'infrastructure', 'other'] as const;
export type FailureCategory = (typeof FAILURE_CATEGORIES)[number];

export const fetchReliability = (days = 30) =>
  unwrap(apiRequest<ApiResponse<ReliabilityData>>(`/admin/metrics/reliability?days=${days}`));

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
  unwrap(apiRequest<ApiResponse<SystemData>>('/admin/metrics/system'));

export type NatsServerInfo = {
  status: 'healthy' | 'unreachable';
  serverId?: string;
  version?: string;
  connections?: number;
  totalConnections?: number;
  memoryMB?: number;
  cpuPercent?: number;
  slowConsumers?: number;
  uptime?: string;
  error?: string;
};

export type NatsStreamRow = {
  name: string;
  messages: number;
  bytes: number;
  firstSeq: number;
  lastSeq: number;
  consumerCount: number;
};

export type NatsConsumerRow = {
  stream: string;
  name: string;
  numPending: number;
  numAckPending: number;
  numRedelivered: number;
  numWaiting: number;
};

export type NatsSummary = {
  status: 'healthy' | 'unreachable';
  totalStreams?: number;
  totalConsumers?: number;
  totalMessages?: number;
  dlqDepth?: number;
  error?: string;
};

export type NatsData = {
  server: NatsServerInfo;
  streams: NatsStreamRow[];
  consumers: NatsConsumerRow[];
  summary: NatsSummary;
};

export const fetchNats = () =>
  unwrap(apiRequest<ApiResponse<NatsData>>('/admin/metrics/nats'));

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
  /** Flattened, table-friendly per-service rows (new backend field). */
  servicesList?: ServiceRow[];
  /** Rolling host resource history (new backend field). */
  history?: { time: string; cpuPercent: number; memPercent: number; diskPercent: number; networkKBs?: number }[];
};

export type ServiceRow = {
  name: string;
  status: string;
  uptime: string;
  goroutines: number;
  heapAllocMB: number;
  heapInuseMB: number;
  sysMB: number;
  goVersion: string;
  error?: string;
};

export const fetchServerPerformance = () =>
  unwrap(apiRequest<ApiResponse<ServerPerformanceData>>('/admin/metrics/server-performance'));

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

export interface EndpointQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  method?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export const fetchApiPerformance = async (params?: EndpointQueryParams): Promise<{ data: ApiPerformanceData; meta?: PaginationMeta }> => {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.search) q.set('search', params.search);
  if (params?.method) q.set('method', params.method);
  if (params?.sortBy) q.set('sortBy', params.sortBy);
  if (params?.sortDir) q.set('sortDir', params.sortDir);
  const qs = q.toString();
  const url = `/admin/metrics/api-performance${qs ? '?' + qs : ''}`;
  const resp = await apiRequest<ApiResponseWithMeta<ApiPerformanceData>>(url);
  return { data: resp.data, meta: resp.meta };
};

// =====================================================================
// Redesign endpoints (new). These may not be deployed yet, so their
// fetchers resolve to null on failure and the UI shows "awaiting data".
// =====================================================================

// --- Executive Overview (8 KPI cards) ---
export type KpiKey =
  | 'totalUsers'
  | 'activeUsers'
  | 'revenue'
  | 'jobsCreated'
  | 'successRate'
  | 'apiRequests'
  | 'apiErrorRate'
  | 'activeServers';

export type ExecutiveKpi = {
  current: number | null;
  previous: number | null;
  sparkline: { date: string; value: number }[];
};

export type ExecutiveOverviewData = {
  period: { from: string; to: string; days: number };
  totalUsers: ExecutiveKpi;
  activeUsers: ExecutiveKpi;
  revenue: ExecutiveKpi & { estimated: boolean; currency: string };
  jobsCreated: ExecutiveKpi;
  successRate: ExecutiveKpi;
  apiRequests: ExecutiveKpi;
  apiErrorRate: ExecutiveKpi;
  activeServers: { current: number; total: number; services: { name: string; status: string }[] };
};

export const fetchExecutiveOverview = (days = 30) =>
  optional(apiRequest<ApiResponse<ExecutiveOverviewData>>(`/admin/metrics/executive?days=${days}`));

// --- Revenue (estimated) ---
export type RevenueData = {
  period: { from: string; to: string; days: number };
  estimated: boolean;
  note: string;
  currency: string;
  prices: Record<string, number>;
  mrr: number;
  arr: number;
  previousMrr: number;
  byPlan: { plan: string; users: number; pricePerMonth: number; mrr: number }[];
  trend: { date: string; mrr: number; byPlan?: Record<string, number> }[];
  planChanges: { date: string; upgrades: number; downgrades: number }[];
};

export const fetchRevenue = (days = 30) =>
  optional(apiRequest<ApiResponse<RevenueData>>(`/admin/metrics/revenue?days=${days}`));

// --- Acquisition channels ---
export type AcquisitionData = {
  period: { from: string; to: string; days: number };
  channels: { channel: string; signups: number; percent: number }[];
  daily: { date: string; channel: string; signups: number }[];
  topReferrers?: { referrer: string; signups: number }[];
  previous?: { channels: { channel: string; signups: number }[] };
};

export const ACQUISITION_CHANNELS = ['organic', 'referral', 'paid', 'campaign', 'direct', 'unknown'] as const;
export type AcquisitionChannel = (typeof ACQUISITION_CHANNELS)[number];

export const fetchAcquisition = (days = 30) =>
  optional(apiRequest<ApiResponse<AcquisitionData>>(`/admin/metrics/acquisition?days=${days}`));

// --- Queue / pipeline status ---
export type QueueStatusData = {
  timestamp: string;
  streams: { name: string; messages: number; bytes: number; consumers: number; oldestMessageAt: string | null; error?: string }[];
  dispatchConsumers: { name: string; pending: number; ackPending: number; redelivered: number }[];
  dlq: { messages: number; oldestAgeSeconds: number | null };
  analyticsLag: {
    analytics: { pending: number; ackPending: number };
    jobsEvents: { pending: number; ackPending: number };
  };
  depthHistory?: { time: string; consumer: string; pending: number }[];
  throughput?: { time: string; processed: number; failed: number; queued?: number }[];
};

export const fetchQueueStatus = () =>
  optional(apiRequest<ApiResponse<QueueStatusData>>('/admin/metrics/queues'));

// --- API traffic trends (sampled time series) ---
export type ApiTrendsData = {
  period: { from: string; to: string; days: number };
  resolution: 'hour' | 'day';
  series: {
    time: string;
    requests: number;
    errors: number;
    errorRate: number;
    avgMs: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
  }[];
  totals: { requests: number; errors: number; errorRate: number; avgMs: number };
  previous?: { requests: number; errors: number; errorRate: number; avgMs: number };
  /** Earliest sample time; UI shows "collecting since" when sparse. */
  sampledSince: string | null;
  errorClasses?: { time: string; clientErrors: number; serverErrors: number; timeouts: number }[];
};

export const fetchApiTrends = (days = 7) =>
  optional(apiRequest<ApiResponse<ApiTrendsData>>(`/admin/metrics/api-trends?days=${days}`));

// --- Activity Audit ---
export type AdminActivityItem = {
  id: string;
  clientEventId?: string;
  userId?: string;
  isGuest: boolean;
  sessionId?: string;
  eventType: string;
  featureId?: string;
  toolId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  documentId?: string;
  status: 'started' | 'success' | 'failed' | 'cancelled';
  failureReason?: string;
  errorCode?: string;
  metadata?: Record<string, unknown>;
  platform?: string;
  deviceType?: string;
  appVersion?: string;
  correlationId?: string;
  occurredAt: string;
  createdAt: string;
};

export type AdminActivityParams = {
  page?: number;
  limit?: number;
  userId?: string;
  eventType?: string;
  toolId?: string;
  status?: string;
  platform?: string;
  search?: string;
  from?: string;
  to?: string;
  sort?: string;
  order?: 'asc' | 'desc';
};

export const fetchAdminActivity = async (
  params?: AdminActivityParams
): Promise<{ data: AdminActivityItem[]; meta?: PaginationMeta }> => {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== '') q.set(key, String(value));
  }
  const qs = q.toString();
  const resp = await apiRequest<ApiResponseWithMeta<AdminActivityItem[]>>(
    `/admin/activity${qs ? '?' + qs : ''}`
  );
  return { data: resp.data ?? [], meta: resp.meta };
};
