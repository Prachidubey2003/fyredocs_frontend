import { apiJson, buildApiUrl } from '@/lib/apiClient';

export type ExportFormat = 'csv' | 'json';
export type ExportStatus = 'queued' | 'processing' | 'ready' | 'failed';

export interface ApiExport {
  id: string;
  organizationId?: string | null;
  format: ExportFormat;
  status: ExportStatus;
  fileName?: string;
  documentCount: number;
  error?: string;
  createdAt: string;
  completedAt?: string | null;
}

type Envelope<T> = { success: boolean; message: string; data: T };

export interface CreateExportInput {
  format: ExportFormat;
  organizationId?: string;
  status?: string;
  folderId?: string;
  tagId?: string;
}

export const listExports = async (): Promise<ApiExport[]> => {
  try {
    const res = await apiJson<Envelope<ApiExport[]>>('/api/exports');
    return res.data ?? [];
  } catch {
    return [];
  }
};

export const createExport = (input: CreateExportInput): Promise<ApiExport> =>
  apiJson<Envelope<ApiExport>>('/api/exports', { method: 'POST', body: JSON.stringify(input) }).then((r) => r.data);

export const exportDownloadUrl = (id: string): string => buildApiUrl(`/api/exports/${id}/download`);
