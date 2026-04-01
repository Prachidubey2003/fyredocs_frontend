export interface ToolItem {
  name: string;
  href: string;
  icon: string;
  comingSoon?: boolean;
}

export const toolCategories: { title: string; color: string; tools: ToolItem[] }[] = [
  {
    title: 'ORGANIZE PDF',
    color: 'text-orange-500',
    tools: [
      { name: 'Merge PDF', href: '/merge', icon: 'layers' },
      { name: 'Split PDF', href: '/split', icon: 'scissors' },
      { name: 'Remove pages', href: '/remove-pages', icon: 'file-minus' },
      { name: 'Extract pages', href: '/extract-pages', icon: 'file-output' },
      { name: 'Organize PDF', href: '/reorder', icon: 'arrow-up-down' },
      { name: 'Scan to PDF', href: '/scan-to-pdf', icon: 'scan' },
    ],
  },
  {
    title: 'OPTIMIZE PDF',
    color: 'text-red-500',
    tools: [
      { name: 'Compress PDF', href: '/compress', icon: 'minimize-2' },
      { name: 'Repair PDF', href: '/repair-pdf', icon: 'wrench' },
      { name: 'OCR PDF', href: '/ocr', icon: 'scan-text' },
    ],
  },
  {
    title: 'CONVERT TO PDF',
    color: 'text-yellow-600',
    tools: [
      { name: 'JPG to PDF', href: '/image-to-pdf', icon: 'file-image' },
      { name: 'WORD to PDF', href: '/word-to-pdf', icon: 'file' },
      { name: 'POWERPOINT to PDF', href: '/powerpoint-to-pdf', icon: 'presentation' },
      { name: 'EXCEL to PDF', href: '/excel-to-pdf', icon: 'file-spreadsheet' },
      { name: 'HTML to PDF', href: '/html-to-pdf', icon: 'code' },
      { name: 'ODT to PDF', href: '/odt-to-pdf', icon: 'file' },
      { name: 'ODS to PDF', href: '/ods-to-pdf', icon: 'file-spreadsheet' },
      { name: 'ODP to PDF', href: '/odp-to-pdf', icon: 'presentation' },
    ],
  },
  {
    title: 'CONVERT FROM PDF',
    color: 'text-purple-500',
    tools: [
      { name: 'PDF to JPG', href: '/pdf-to-image', icon: 'image' },
      { name: 'PDF to WORD', href: '/pdf-to-word', icon: 'file-text' },
      { name: 'PDF to POWERPOINT', href: '/pdf-to-ppt', icon: 'presentation' },
      { name: 'PDF to EXCEL', href: '/pdf-to-excel', icon: 'table' },
      { name: 'PDF to Text', href: '/pdf-to-text', icon: 'file-type' },
      { name: 'PDF to PDF/A', href: '/pdf-to-pdfa', icon: 'archive' },
    ],
  },
  {
    title: 'CONVERT TO LIBREOFFICE',
    color: 'text-teal-500',
    tools: [
      { name: 'PDF to ODT', href: '/pdf-to-odt', icon: 'file-text' },
      { name: 'PDF to ODS', href: '/pdf-to-ods', icon: 'table' },
      { name: 'PDF to ODP', href: '/pdf-to-odp', icon: 'presentation' },
      { name: 'Word to ODT', href: '/word-to-odt', icon: 'file' },
      { name: 'Excel to ODS', href: '/excel-to-ods', icon: 'file-spreadsheet' },
      { name: 'PowerPoint to ODP', href: '/powerpoint-to-odp', icon: 'presentation' },
    ],
  },
  {
    title: 'EDIT PDF',
    color: 'text-blue-500',
    tools: [
      { name: 'Rotate PDF', href: '/rotate', icon: 'rotate-cw' },
      { name: 'Add page numbers', href: '/add-page-numbers', icon: 'hash' },
      { name: 'Add watermark', href: '/watermark', icon: 'stamp' },
      { name: 'Edit PDF', href: '/edit-pdf', icon: 'edit' },
    ],
  },
  {
    title: 'PDF SECURITY',
    color: 'text-green-500',
    tools: [
      { name: 'Unlock PDF', href: '/unlock', icon: 'unlock' },
      { name: 'Protect PDF', href: '/protect', icon: 'lock' },
      { name: 'Sign PDF', href: '/sign-pdf', icon: 'pen-tool' },
    ],
  },
];

export const convertToPdf: ToolItem[] = toolCategories
  .find((c) => c.title === 'CONVERT TO PDF')!
  .tools;

export const convertFromPdf: ToolItem[] = toolCategories
  .find((c) => c.title === 'CONVERT FROM PDF')!
  .tools;
