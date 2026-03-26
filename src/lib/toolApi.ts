import { ToolId } from '@/types';

type ToolApiConfig = {
  basePath: string;
  tool: string;
};

const TOOL_API_CONFIG: Record<ToolId, ToolApiConfig> = {
  // Organize PDF tools
  merge: { basePath: '/api/organize-pdf', tool: 'merge-pdf' },
  split: { basePath: '/api/organize-pdf', tool: 'split-pdf' },
  reorder: { basePath: '/api/organize-pdf', tool: 'organize-pdf' },
  'remove-pages': { basePath: '/api/organize-pdf', tool: 'remove-pages' },
  'extract-pages': { basePath: '/api/organize-pdf', tool: 'extract-pages' },
  'scan-to-pdf': { basePath: '/api/organize-pdf', tool: 'scan-to-pdf' },

  // Optimize PDF tools
  compress: { basePath: '/api/optimize-pdf', tool: 'compress-pdf' },
  ocr: { basePath: '/api/optimize-pdf', tool: 'ocr-pdf' },
  'repair-pdf': { basePath: '/api/optimize-pdf', tool: 'repair-pdf' },

  // Convert From PDF tools
  'pdf-to-word': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-word' },
  'pdf-to-excel': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-excel' },
  'pdf-to-image': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-image' },
  'pdf-to-ppt': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-ppt' },
  'pdf-to-html': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-html' },
  'pdf-to-text': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-text' },
  'pdf-to-pdfa': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-pdfa' },

  // Convert To PDF tools
  'word-to-pdf': { basePath: '/api/convert-to-pdf', tool: 'word-to-pdf' },
  'excel-to-pdf': { basePath: '/api/convert-to-pdf', tool: 'excel-to-pdf' },
  'image-to-pdf': { basePath: '/api/convert-to-pdf', tool: 'image-to-pdf' },
  'powerpoint-to-pdf': { basePath: '/api/convert-to-pdf', tool: 'powerpoint-to-pdf' },
  'html-to-pdf': { basePath: '/api/convert-to-pdf', tool: 'html-to-pdf' },

  // Security tools
  'unlock-pdf': { basePath: '/api/convert-to-pdf', tool: 'unlock-pdf' },

  // Edit PDF tools
  'add-page-numbers': { basePath: '/api/convert-to-pdf', tool: 'add-page-numbers' },
  'edit-pdf': { basePath: '/api/convert-to-pdf', tool: 'edit-pdf' },
  'sign-pdf': { basePath: '/api/convert-to-pdf', tool: 'sign-pdf' },

  // Legacy tools (keeping for backward compatibility)
  rotate: { basePath: '/api/organize-pdf', tool: 'rotate-pdf' },
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
