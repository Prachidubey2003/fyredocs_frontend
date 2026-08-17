import { apiRequest } from '@/lib/apiClient';
import type { ApiResponseWithMeta, PaginationMeta } from '@/lib/adminApi';

export type ActivityItem = {
  id: string;
  eventType: string;
  sessionId?: string;
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

export type MyActivityParams = {
  page?: number;
  limit?: number;
  eventType?: string;
  status?: string;
  from?: string;
  to?: string;
};

export type MyActivityResult = {
  items: ActivityItem[];
  meta: PaginationMeta;
};

export const fetchMyActivity = async (
  params: MyActivityParams = {}
): Promise<MyActivityResult> => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.eventType) query.set('eventType', params.eventType);
  if (params.status) query.set('status', params.status);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  const qs = query.toString();

  const res = await apiRequest<ApiResponseWithMeta<ActivityItem[]>>(
    `/api/activity/me${qs ? `?${qs}` : ''}`
  );
  return {
    items: res.data ?? [],
    meta: res.meta ?? { page: params.page ?? 1, limit: params.limit ?? 50, total: 0 },
  };
};
