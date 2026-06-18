import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/notificationsApi';
import { buildApiUrl } from '@/lib/apiClient';

const KEY = ['notifications'] as const;

/**
 * Live notifications via Server-Sent Events. Each pushed notification refreshes
 * the cache so the bell updates instantly; the 30s poll remains a fallback if
 * the stream drops. EventSource auto-reconnects on its own.
 */
export const useNotificationStream = () => {
  const qc = useQueryClient();
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource(buildApiUrl('/api/notifications/stream'), { withCredentials: true });
    } catch {
      return;
    }
    const refresh = () => void qc.invalidateQueries({ queryKey: KEY });
    es.addEventListener('notification', refresh);
    return () => {
      es?.removeEventListener('notification', refresh);
      es?.close();
    };
  }, [qc]);
};

export const useNotifications = () =>
  useQuery({
    queryKey: KEY,
    queryFn: listNotifications,
    refetchInterval: 30_000,
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSettled: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSettled: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
};
