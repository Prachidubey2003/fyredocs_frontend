import { ToolDefinition, ToolId, ToolCategory } from '@/types';

/**
 * Tool configuration registry.
 * Each tool is fully defined here with its constraints and metadata.
 * Adding a new tool requires only adding an entry here and implementing its options component.
 */

const MB = 1024 * 1024;

export const TOOLS: Record<ToolId, ToolDefinition> = {
  // ============================================================================
  // ORGANIZE PDF TOOLS
  // ============================================================================
  merge: {
    id: 'merge',
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into one document',
    category: 'merge',
    icon: 'layers',
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    maxFiles: 20,
    minFiles: 2,
    maxFileSize: 50 * MB,
    route: '/merge',
  },
  split: {
    id: 'split',
    name: 'Split PDF',
    description: 'Separate one PDF into multiple documents',
    category: 'split',
    icon: 'scissors',
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    maxFiles: 1,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/split',
  },
  reorder: {
    id: 'reorder',
    name: 'Reorder Pages',
    description: 'Rearrange pages within a PDF document',
    category: 'organize',
    icon: 'arrow-up-down',
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    maxFiles: 1,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/reorder',
  },
  'remove-pages': {
    id: 'remove-pages',
    name: 'Remove Pages',
    description: 'Remove specific pages from a PDF document',
    category: 'organize',
    icon: 'file-minus',
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    maxFiles: 1,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/remove-pages',
  },
  'extract-pages': {
    id: 'extract-pages',
    name: 'Extract Pages',
    description: 'Extract specific pages into a new PDF',
    category: 'organize',
    icon: 'file-output',
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    maxFiles: 1,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/extract-pages',
  },
  'scan-to-pdf': {
    id: 'scan-to-pdf',
    name: 'Scan to PDF',
    description: 'Convert scanned images to PDF with optional OCR',
    category: 'convert',
    icon: 'scan',
    acceptedFileTypes: ['.jpg', '.jpeg', '.png', '.webp', 'image/jpeg', 'image/png', 'image/webp'],
    maxFiles: 20,
    minFiles: 1,
    maxFileSize: 20 * MB,
    route: '/scan-to-pdf',
  },

  // ============================================================================
  // OPTIMIZE PDF TOOLS
  // ============================================================================
  compress: {
    id: 'compress',
    name: 'Compress PDF',
    description: 'Reduce file size while maintaining quality',
    category: 'compress',
    icon: 'minimize-2',
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    maxFiles: 10,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/compress',
  },
  ocr: {
    id: 'ocr',
    name: 'OCR PDF',
    description: 'Add searchable text layer to scanned PDFs',
    category: 'ocr',
    icon: 'scan-text',
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    maxFiles: 5,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/ocr',
  },
  'repair-pdf': {
    id: 'repair-pdf',
    name: 'Repair PDF',
    description: 'Fix corrupted or damaged PDF files',
    category: 'organize',
    icon: 'wrench',
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    maxFiles: 1,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/repair-pdf',
  },

  // ============================================================================
  // CONVERT FROM PDF TOOLS
  // ============================================================================
  'pdf-to-word': {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    description: 'Convert PDF documents to editable Word files',
    category: 'convert',
    icon: 'file-text',
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    maxFiles: 5,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/pdf-to-word',
  },
  'pdf-to-excel': {
    id: 'pdf-to-excel',
    name: 'PDF to Excel',
    description: 'Extract tables from PDFs to Excel spreadsheets',
    category: 'convert',
    icon: 'table',
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    maxFiles: 5,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/pdf-to-excel',
  },
  'pdf-to-image': {
    id: 'pdf-to-image',
    name: 'PDF to Image',
    description: 'Convert PDF pages to PNG images',
    category: 'convert',
    icon: 'image',
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    maxFiles: 5,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/pdf-to-image',
  },
  'pdf-to-ppt': {
    id: 'pdf-to-ppt',
    name: 'PDF to PowerPoint',
    description: 'Convert PDF to PowerPoint presentation',
    category: 'convert',
    icon: 'presentation',
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    maxFiles: 5,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/pdf-to-ppt',
  },
  'pdf-to-html': {
    id: 'pdf-to-html',
    name: 'PDF to HTML',
    description: 'Convert PDF to HTML with embedded images',
    category: 'convert',
    icon: 'code',
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    maxFiles: 5,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/pdf-to-html',
  },
  'pdf-to-text': {
    id: 'pdf-to-text',
    name: 'PDF to Text',
    description: 'Extract text content from PDF documents',
    category: 'convert',
    icon: 'file-type',
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    maxFiles: 5,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/pdf-to-text',
  },
  'pdf-to-pdfa': {
    id: 'pdf-to-pdfa',
    name: 'PDF to PDF/A',
    description: 'Convert PDF to archival format (PDF/A-2b)',
    category: 'convert',
    icon: 'archive',
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    maxFiles: 5,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/pdf-to-pdfa',
  },

  // ============================================================================
  // CONVERT TO PDF TOOLS
  // ============================================================================
  'word-to-pdf': {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    description: 'Convert Word documents to PDF format',
    category: 'convert',
    icon: 'file',
    acceptedFileTypes: ['.doc', '.docx', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxFiles: 5,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/word-to-pdf',
  },
  'excel-to-pdf': {
    id: 'excel-to-pdf',
    name: 'Excel to PDF',
    description: 'Convert Excel spreadsheets to PDF format',
    category: 'convert',
    icon: 'file-spreadsheet',
    acceptedFileTypes: ['.xls', '.xlsx', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    maxFiles: 5,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/excel-to-pdf',
  },
  'image-to-pdf': {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    description: 'Convert images to a PDF document',
    category: 'convert',
    icon: 'file-image',
    acceptedFileTypes: ['.jpg', '.jpeg', '.png', '.webp', 'image/jpeg', 'image/png', 'image/webp'],
    maxFiles: 20,
    minFiles: 1,
    maxFileSize: 20 * MB,
    route: '/image-to-pdf',
  },
  'powerpoint-to-pdf': {
    id: 'powerpoint-to-pdf',
    name: 'PowerPoint to PDF',
    description: 'Convert PowerPoint presentations to PDF format',
    category: 'convert',
    icon: 'presentation',
    acceptedFileTypes: ['.ppt', '.pptx', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    maxFiles: 5,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/powerpoint-to-pdf',
  },
  'html-to-pdf': {
    id: 'html-to-pdf',
    name: 'HTML to PDF',
    description: 'Convert HTML files to PDF format',
    category: 'convert',
    icon: 'code',
    acceptedFileTypes: ['.html', '.htm', 'text/html'],
    maxFiles: 5,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/html-to-pdf',
  },

  // ============================================================================
  // LEGACY TOOLS (kept for backward compatibility)
  // ============================================================================
  rotate: {
    id: 'rotate',
    name: 'Rotate Pages',
    description: 'Rotate PDF pages to the correct orientation',
    category: 'organize',
    icon: 'rotate-cw',
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    maxFiles: 1,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/rotate',
  },
  watermark: {
    id: 'watermark',
    name: 'Add Watermark',
    description: 'Add text or image watermarks to PDFs',
    category: 'watermark',
    icon: 'stamp',
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    maxFiles: 10,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/watermark',
  },
  'password-protect': {
    id: 'password-protect',
    name: 'Protect PDF',
    description: 'Add password protection to PDF documents',
    category: 'security',
    icon: 'lock',
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    maxFiles: 10,
    minFiles: 1,
    maxFileSize: 50 * MB,
    route: '/protect',
  },
};

export const TOOL_CATEGORIES: Record<ToolCategory, { name: string; color: string }> = {
  merge: { name: 'Merge & Combine', color: 'tool-merge' },
  split: { name: 'Split & Extract', color: 'tool-split' },
  compress: { name: 'Compress', color: 'tool-compress' },
  convert: { name: 'Convert', color: 'tool-convert' },
  organize: { name: 'Organize', color: 'tool-organize' },
  security: { name: 'Security', color: 'tool-security' },
  ocr: { name: 'OCR', color: 'tool-ocr' },
  watermark: { name: 'Watermark', color: 'tool-watermark' },
};

export const getToolsByCategory = (category: ToolCategory): ToolDefinition[] => {
  return Object.values(TOOLS).filter((tool) => tool.category === category);
};

export const getAllTools = (): ToolDefinition[] => {
  return Object.values(TOOLS);
};

export const getToolById = (id: ToolId): ToolDefinition | undefined => {
  return TOOLS[id];
};
