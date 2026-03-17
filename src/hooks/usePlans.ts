import { useQuery } from '@tanstack/react-query';
import { apiJson, buildApiUrl } from '@/lib/apiClient';

export type Plan = {
  id: string;
  name: string;
  maxFileSizeMb: number;
  maxFilesPerJob: number;
  retentionDays: number;
};

type PlansResponse = {
  data: {
    plans: Plan[];
  };
};

const fetchPlans = async (): Promise<Plan[]> => {
  const res = await apiJson<PlansResponse>(buildApiUrl('/auth/plans'));
  return res.data?.plans ?? [];
};

export const usePlans = () =>
  useQuery({
    queryKey: ['plans'],
    queryFn: fetchPlans,
    staleTime: 5 * 60 * 1000, // 5 min — plans rarely change
  });

export const usePlan = (planName: string) => {
  const { data: plans, ...rest } = usePlans();
  const plan = plans?.find((p) => p.name === planName);
  return { plan, ...rest };
};
