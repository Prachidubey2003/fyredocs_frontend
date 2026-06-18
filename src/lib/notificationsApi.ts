import { apiJson } from '@/lib/apiClient';

export interface ApiNotification {
  id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  readAt?: string | null;
  createdAt: string;
}

interface NotificationsPayload {
  notifications: ApiNotification[];
  unreadCount: number;
}

type Envelope<T> = { success: boolean; message: string; data: T };

export const listNotifications = async (): Promise<NotificationsPayload> => {
  try {
    const res = await apiJson<Envelope<NotificationsPayload>>('/api/notifications');
    return { notifications: res.data?.notifications ?? [], unreadCount: res.data?.unreadCount ?? 0 };
  } catch {
    return { notifications: [], unreadCount: 0 };
  }
};

export const markNotificationRead = (id: string): Promise<void> =>
  apiJson(`/api/notifications/${id}/read`, { method: 'POST' }).then(() => undefined);

export const markAllNotificationsRead = (): Promise<void> =>
  apiJson('/api/notifications/read-all', { method: 'POST' }).then(() => undefined);
