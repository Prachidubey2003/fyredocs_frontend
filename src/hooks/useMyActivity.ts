import { useQuery } from '@tanstack/react-query';
import { fetchMyActivity, type MyActivityParams } from '@/lib/activityApi';

export const useMyActivity = (params: MyActivityParams = {}) =>
  useQuery({
    queryKey: ['activity', 'me', params],
    queryFn: () => fetchMyActivity(params),
    staleTime: 30_000,
  });
