import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listExports, createExport, type ApiExport, type CreateExportInput } from '@/lib/exportsApi';

const KEY = ['exports'] as const;

export const useExports = () =>
  useQuery({
    queryKey: KEY,
    queryFn: listExports,
    // Poll while any export is still generating, then stop.
    refetchInterval: (query) => {
      const data = query.state.data as ApiExport[] | undefined;
      return data?.some((e) => e.status === 'queued' || e.status === 'processing') ? 2000 : false;
    },
  });

export const useCreateExport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExportInput) => createExport(input),
    onSettled: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
};
