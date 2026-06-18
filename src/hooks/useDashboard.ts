import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '@/lib/dashboardApi';

/**
 * Fetches the unified role-aware dashboard summary. The backend decides whether
 * the payload is the admin or the user shape based on the caller's role.
 */
export const useDashboard = (days = 30) =>
  useQuery({
    queryKey: ['dashboard', days],
    queryFn: () => fetchDashboard(days),
    staleTime: 5 * 60_000,
  });
