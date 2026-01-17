import { ToolId } from '@/types';

type ToolApiConfig = {
  basePath: string;
  tool: string;
};

const TOOL_API_CONFIG: Record<ToolId, ToolApiConfig> = {
  merge: { basePath: '/api/convert-to-pdf', tool: 'merge-pdf' },
  split: { basePath: '/api/convert-to-pdf', tool: 'split-pdf' },
  compress: { basePath: '/api/convert-to-pdf', tool: 'compress-pdf' },
  'pdf-to-word': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-word' },
  'word-to-pdf': { basePath: '/api/convert-to-pdf', tool: 'word-to-pdf' },
  'pdf-to-excel': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-excel' },
  'excel-to-pdf': { basePath: '/api/convert-to-pdf', tool: 'excel-to-pdf' },
  'pdf-to-image': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-image' },
  'image-to-pdf': { basePath: '/api/convert-to-pdf', tool: 'image-to-pdf' },
  reorder: { basePath: '/api/convert-to-pdf', tool: 'page-reorder' },
  rotate: { basePath: '/api/convert-to-pdf', tool: 'page-rotate' },
  ocr: { basePath: '/api/convert-from-pdf', tool: 'ocr' },
  watermark: { basePath: '/api/convert-to-pdf', tool: 'watermark-pdf' },
  'password-protect': { basePath: '/api/convert-to-pdf', tool: 'protect-pdf' },
};

export const getToolApiConfig = (toolId: ToolId) => TOOL_API_CONFIG[toolId];

export const buildJobPath = (toolId: ToolId, jobId?: string) => {
  const { basePath, tool } = getToolApiConfig(toolId);
  return jobId ? `${basePath}/${tool}/${jobId}` : `${basePath}/${tool}`;
};

export const buildDownloadPath = (toolId: ToolId, jobId: string) =>
  `${buildJobPath(toolId, jobId)}/download`;
