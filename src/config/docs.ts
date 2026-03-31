import { ToolId } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export type DocCategory = 'getting-started' | 'tool-guide' | 'concept' | 'faq';

export interface DocSection {
  heading?: string;
  content: string;
  type: 'paragraph' | 'steps' | 'table' | 'tip' | 'formats';
  items?: string[];
  tableData?: { headers: string[]; rows: string[][] };
}

export interface DocEntry {
  slug: string;
  title: string;
  description: string;
  category: DocCategory;
  toolCategory?: string;
  toolId?: ToolId;
  sections: DocSection[];
}

// ============================================================================
// SIDEBAR NAVIGATION STRUCTURE
// ============================================================================

export interface DocNavGroup {
  title: string;
  color: string;
  items: { slug: string; title: string }[];
}

export const docNavGroups: DocNavGroup[] = [
  {
    title: 'Getting Started',
    color: 'text-primary',
    items: [
      { slug: 'getting-started', title: 'Introduction' },
    ],
  },
  {
    title: 'Organize PDF',
    color: 'text-orange-500',
    items: [
      { slug: 'merge-pdf', title: 'Merge PDF' },
      { slug: 'split-pdf', title: 'Split PDF' },
      { slug: 'reorder-pages', title: 'Reorder Pages' },
      { slug: 'remove-pages', title: 'Remove Pages' },
      { slug: 'extract-pages', title: 'Extract Pages' },
      { slug: 'scan-to-pdf', title: 'Scan to PDF' },
    ],
  },
  {
    title: 'Optimize PDF',
    color: 'text-red-500',
    items: [
      { slug: 'compress-pdf', title: 'Compress PDF' },
      { slug: 'repair-pdf', title: 'Repair PDF' },
      { slug: 'ocr-pdf', title: 'OCR PDF' },
    ],
  },
  {
    title: 'Convert to PDF',
    color: 'text-yellow-600',
    items: [
      { slug: 'image-to-pdf', title: 'Image to PDF' },
      { slug: 'word-to-pdf', title: 'Word to PDF' },
      { slug: 'powerpoint-to-pdf', title: 'PowerPoint to PDF' },
      { slug: 'excel-to-pdf', title: 'Excel to PDF' },
      { slug: 'html-to-pdf', title: 'HTML to PDF' },
    ],
  },
  {
    title: 'Convert from PDF',
    color: 'text-purple-500',
    items: [
      { slug: 'pdf-to-image', title: 'PDF to Image' },
      { slug: 'pdf-to-word', title: 'PDF to Word' },
      { slug: 'pdf-to-ppt', title: 'PDF to PowerPoint' },
      { slug: 'pdf-to-excel', title: 'PDF to Excel' },
      { slug: 'pdf-to-text', title: 'PDF to Text' },
      { slug: 'pdf-to-pdfa', title: 'PDF to PDF/A' },
    ],
  },
  {
    title: 'Edit PDF',
    color: 'text-blue-500',
    items: [
      { slug: 'rotate-pdf', title: 'Rotate Pages' },
      { slug: 'add-page-numbers', title: 'Add Page Numbers' },
      { slug: 'add-watermark', title: 'Add Watermark' },
      { slug: 'edit-pdf', title: 'Edit PDF' },
    ],
  },
  {
    title: 'PDF Security',
    color: 'text-green-500',
    items: [
      { slug: 'unlock-pdf', title: 'Unlock PDF' },
      { slug: 'protect-pdf', title: 'Protect PDF' },
      { slug: 'sign-pdf', title: 'Sign PDF' },
    ],
  },
  {
    title: 'Concepts',
    color: 'text-muted-foreground',
    items: [
      { slug: 'supported-formats', title: 'Supported Formats' },
      { slug: 'file-limits', title: 'File Limits' },
      { slug: 'security-privacy', title: 'Security & Privacy' },
      { slug: 'accounts-plans', title: 'Accounts & Plans' },
    ],
  },
  {
    title: 'FAQ',
    color: 'text-muted-foreground',
    items: [
      { slug: 'faq', title: 'FAQ' },
    ],
  },
];

// ============================================================================
// DOCUMENTATION ENTRIES
// ============================================================================

export const docs: DocEntry[] = [
  // ──────────────────────────────────────
  // GETTING STARTED
  // ──────────────────────────────────────
  {
    slug: 'getting-started',
    title: 'Getting Started with EsyDocs',
    description: 'Learn how to use EsyDocs to work with your PDF files quickly and easily.',
    category: 'getting-started',
    sections: [
      {
        heading: 'What is EsyDocs?',
        content: 'EsyDocs is a free online platform that lets you work with PDF files right in your browser. You can merge, split, compress, convert, and edit PDFs without installing any software.',
        type: 'paragraph',
      },
      {
        heading: 'How it works',
        content: 'Every tool on EsyDocs follows the same simple workflow:',
        type: 'steps',
        items: [
          'Choose a tool from the homepage or navigation menu',
          'Upload your file(s) by dragging and dropping or clicking to browse',
          'Configure any options (like compression quality or page ranges)',
          'Click the action button to start processing',
          'Download your result once processing is complete',
        ],
      },
      {
        heading: 'No account required',
        content: 'You can use EsyDocs as a guest without signing up. Guest files are automatically deleted after 2 hours. Create a free account for longer retention and higher file size limits.',
        type: 'tip',
      },
      {
        heading: 'Your files are safe',
        content: 'All files are processed securely on our servers and automatically deleted after processing. We never share, sell, or access your documents. See our Security & Privacy page for details.',
        type: 'paragraph',
      },
    ],
  },

  // ──────────────────────────────────────
  // ORGANIZE PDF TOOLS
  // ──────────────────────────────────────
  {
    slug: 'merge-pdf',
    title: 'Merge PDF',
    description: 'Combine multiple PDF files into a single document.',
    category: 'tool-guide',
    toolCategory: 'ORGANIZE PDF',
    toolId: 'merge',
    sections: [
      {
        heading: 'What it does',
        content: 'Merge PDF lets you combine two or more PDF files into a single document. The pages from each file are added in the order you arrange them.',
        type: 'paragraph',
      },
      {
        heading: 'When to use it',
        content: '',
        type: 'steps',
        items: [
          'Combining chapters or sections into one document',
          'Merging scanned pages that were saved as separate files',
          'Putting together a report from multiple PDF sources',
          'Creating a single portfolio from multiple documents',
        ],
      },
      {
        heading: 'Supported formats',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Input', 'Output', 'Max files', 'Max file size'],
          rows: [['PDF', 'PDF', '20', '50 MB per file']],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload 2 or more PDF files',
          'Drag and drop to reorder the files in your preferred sequence',
          'Click "Merge" to combine them',
          'Download your merged PDF',
        ],
      },
      {
        heading: 'Tip',
        content: 'You can drag and drop files to rearrange them before merging. The final document will follow the order shown on screen.',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'split-pdf',
    title: 'Split PDF',
    description: 'Separate a PDF into multiple smaller documents.',
    category: 'tool-guide',
    toolCategory: 'ORGANIZE PDF',
    toolId: 'split',
    sections: [
      {
        heading: 'What it does',
        content: 'Split PDF lets you break a single PDF file into multiple smaller documents. You can split by page ranges, extract specific pages, or split into equal chunks.',
        type: 'paragraph',
      },
      {
        heading: 'When to use it',
        content: '',
        type: 'steps',
        items: [
          'Extracting a chapter from a larger document',
          'Breaking a large file into smaller, more manageable parts',
          'Separating pages for individual sharing',
        ],
      },
      {
        heading: 'Options',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Option', 'Description'],
          rows: [
            ['Split all pages', 'Creates a separate PDF for every page'],
            ['Page range', 'Specify which pages to extract (e.g., 1-3, 5, 7-9)'],
            ['Equal chunks', 'Split into groups of N pages each'],
          ],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload a PDF file',
          'Choose your split mode and configure page ranges',
          'Click "Split" to process',
          'Download your split files',
        ],
      },
    ],
  },
  {
    slug: 'reorder-pages',
    title: 'Reorder Pages',
    description: 'Rearrange the pages within a PDF document.',
    category: 'tool-guide',
    toolCategory: 'ORGANIZE PDF',
    toolId: 'reorder',
    sections: [
      {
        heading: 'What it does',
        content: 'Reorder Pages lets you rearrange pages within a PDF document. Specify the new page order and get a reorganized PDF.',
        type: 'paragraph',
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload a PDF file',
          'Enter the new page order (e.g., "3,1,2,5,4")',
          'Click "Reorder" to process',
          'Download the reorganized PDF',
        ],
      },
      {
        heading: 'Tip',
        content: 'Use comma-separated page numbers to define the exact order you want. For example, "3,1,2" puts page 3 first, then page 1, then page 2.',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'remove-pages',
    title: 'Remove Pages',
    description: 'Delete specific pages from a PDF document.',
    category: 'tool-guide',
    toolCategory: 'ORGANIZE PDF',
    toolId: 'remove-pages',
    sections: [
      {
        heading: 'What it does',
        content: 'Remove Pages lets you delete specific pages from a PDF document, giving you a cleaner file with only the content you need.',
        type: 'paragraph',
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload a PDF file',
          'Enter the page numbers to remove (e.g., "2,4,6-8")',
          'Click "Remove Pages" to process',
          'Download the updated PDF',
        ],
      },
      {
        heading: 'Tip',
        content: 'You can use ranges like "6-8" to remove consecutive pages, or list individual pages separated by commas.',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'extract-pages',
    title: 'Extract Pages',
    description: 'Pull out specific pages into a new PDF document.',
    category: 'tool-guide',
    toolCategory: 'ORGANIZE PDF',
    toolId: 'extract-pages',
    sections: [
      {
        heading: 'What it does',
        content: 'Extract Pages lets you pull specific pages out of a PDF and save them as a new document. The original file remains unchanged.',
        type: 'paragraph',
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload a PDF file',
          'Enter the page numbers to extract (e.g., "1,3,5-7")',
          'Click "Extract" to process',
          'Download the new PDF with just the extracted pages',
        ],
      },
    ],
  },
  {
    slug: 'scan-to-pdf',
    title: 'Scan to PDF',
    description: 'Convert scanned images into a PDF document.',
    category: 'tool-guide',
    toolCategory: 'ORGANIZE PDF',
    toolId: 'scan-to-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'Scan to PDF converts scanned images (JPG, PNG, WebP) into a single PDF document. You can optionally apply OCR to make the text searchable.',
        type: 'paragraph',
      },
      {
        heading: 'Supported formats',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Input', 'Output', 'Max files', 'Max file size'],
          rows: [['JPG, PNG, WebP', 'PDF', '20', '20 MB per file']],
        },
      },
      {
        heading: 'Options',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Option', 'Description'],
          rows: [
            ['OCR', 'Enable to add searchable text to the output PDF'],
            ['Language', 'Choose the language for OCR text recognition'],
          ],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload your scanned images',
          'Optionally enable OCR and select a language',
          'Click "Convert" to create the PDF',
          'Download the resulting PDF',
        ],
      },
    ],
  },

  // ──────────────────────────────────────
  // OPTIMIZE PDF TOOLS
  // ──────────────────────────────────────
  {
    slug: 'compress-pdf',
    title: 'Compress PDF',
    description: 'Reduce PDF file size while maintaining quality.',
    category: 'tool-guide',
    toolCategory: 'OPTIMIZE PDF',
    toolId: 'compress',
    sections: [
      {
        heading: 'What it does',
        content: 'Compress PDF reduces the file size of your PDF documents. Choose from different quality levels to balance between file size and visual quality.',
        type: 'paragraph',
      },
      {
        heading: 'When to use it',
        content: '',
        type: 'steps',
        items: [
          'Sending PDFs via email with size restrictions',
          'Uploading documents to systems with file size limits',
          'Reducing storage space for large document archives',
        ],
      },
      {
        heading: 'Options',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Quality', 'Description'],
          rows: [
            ['Low compression', 'Minimal size reduction, best quality'],
            ['Medium compression', 'Balanced size reduction and quality'],
            ['High compression', 'Significant size reduction, good quality'],
            ['Extreme compression', 'Maximum size reduction, lower quality'],
          ],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload one or more PDF files (up to 10)',
          'Select your desired compression level',
          'Click "Compress" to process',
          'Download the compressed file(s)',
        ],
      },
    ],
  },
  {
    slug: 'repair-pdf',
    title: 'Repair PDF',
    description: 'Fix corrupted or damaged PDF files.',
    category: 'tool-guide',
    toolCategory: 'OPTIMIZE PDF',
    toolId: 'repair-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'Repair PDF attempts to fix corrupted or damaged PDF files. It can recover content from files that won\'t open or display incorrectly.',
        type: 'paragraph',
      },
      {
        heading: 'When to use it',
        content: '',
        type: 'steps',
        items: [
          'PDF files that won\'t open in your viewer',
          'Documents that display blank or garbled pages',
          'Files that were corrupted during download or transfer',
        ],
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload the damaged PDF file',
          'Click "Repair" to start the process',
          'Download the repaired file',
        ],
      },
      {
        heading: 'Tip',
        content: 'Not all corrupted files can be recovered. If the repair doesn\'t work, try opening the file in a different PDF viewer first to rule out a viewer-specific issue.',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'ocr-pdf',
    title: 'OCR PDF',
    description: 'Add searchable text to scanned PDF documents.',
    category: 'tool-guide',
    toolCategory: 'OPTIMIZE PDF',
    toolId: 'ocr',
    sections: [
      {
        heading: 'What it does',
        content: 'OCR (Optical Character Recognition) adds a searchable text layer to scanned PDF documents. After OCR, you can select, copy, and search text within the document.',
        type: 'paragraph',
      },
      {
        heading: 'When to use it',
        content: '',
        type: 'steps',
        items: [
          'Making scanned documents searchable',
          'Enabling text copy from image-based PDFs',
          'Preparing documents for text extraction or indexing',
        ],
      },
      {
        heading: 'Options',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Option', 'Description'],
          rows: [
            ['Language', 'Select the document language for accurate recognition'],
            ['DPI', 'Set resolution (150, 300, 400, or 600) — higher is more accurate but slower'],
          ],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 5 scanned PDF files',
          'Select the language and DPI settings',
          'Click "OCR" to process',
          'Download the searchable PDF(s)',
        ],
      },
    ],
  },

  // ──────────────────────────────────────
  // CONVERT TO PDF TOOLS
  // ──────────────────────────────────────
  {
    slug: 'image-to-pdf',
    title: 'Image to PDF',
    description: 'Convert images into a PDF document.',
    category: 'tool-guide',
    toolCategory: 'CONVERT TO PDF',
    toolId: 'image-to-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'Image to PDF converts your images (JPG, PNG, WebP) into a PDF document. Upload multiple images to create a multi-page PDF.',
        type: 'paragraph',
      },
      {
        heading: 'Supported formats',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Input', 'Output', 'Max files', 'Max file size'],
          rows: [['JPG, PNG, WebP', 'PDF', '20', '20 MB per file']],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload one or more images',
          'Arrange them in the desired order',
          'Click "Convert" to create the PDF',
          'Download the resulting PDF',
        ],
      },
    ],
  },
  {
    slug: 'word-to-pdf',
    title: 'Word to PDF',
    description: 'Convert Word documents to PDF format.',
    category: 'tool-guide',
    toolCategory: 'CONVERT TO PDF',
    toolId: 'word-to-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'Word to PDF converts Microsoft Word documents (.doc, .docx) into PDF format while preserving formatting, fonts, and layout.',
        type: 'paragraph',
      },
      {
        heading: 'Supported formats',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Input', 'Output', 'Max files', 'Max file size'],
          rows: [['DOC, DOCX', 'PDF', '5', '50 MB per file']],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload your Word document(s)',
          'Click "Convert" to start',
          'Download the PDF version',
        ],
      },
    ],
  },
  {
    slug: 'powerpoint-to-pdf',
    title: 'PowerPoint to PDF',
    description: 'Convert PowerPoint presentations to PDF format.',
    category: 'tool-guide',
    toolCategory: 'CONVERT TO PDF',
    toolId: 'powerpoint-to-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'PowerPoint to PDF converts your presentations (.ppt, .pptx) into PDF format. Each slide becomes a page in the output PDF.',
        type: 'paragraph',
      },
      {
        heading: 'Supported formats',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Input', 'Output', 'Max files', 'Max file size'],
          rows: [['PPT, PPTX', 'PDF', '5', '50 MB per file']],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload your PowerPoint file(s)',
          'Click "Convert" to start',
          'Download the PDF version',
        ],
      },
    ],
  },
  {
    slug: 'excel-to-pdf',
    title: 'Excel to PDF',
    description: 'Convert Excel spreadsheets to PDF format.',
    category: 'tool-guide',
    toolCategory: 'CONVERT TO PDF',
    toolId: 'excel-to-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'Excel to PDF converts your spreadsheets (.xls, .xlsx) into PDF format, preserving tables, formatting, and layout.',
        type: 'paragraph',
      },
      {
        heading: 'Supported formats',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Input', 'Output', 'Max files', 'Max file size'],
          rows: [['XLS, XLSX', 'PDF', '5', '50 MB per file']],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload your Excel file(s)',
          'Click "Convert" to start',
          'Download the PDF version',
        ],
      },
    ],
  },
  {
    slug: 'html-to-pdf',
    title: 'HTML to PDF',
    description: 'Convert HTML files to PDF format.',
    category: 'tool-guide',
    toolCategory: 'CONVERT TO PDF',
    toolId: 'html-to-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'HTML to PDF converts HTML files into PDF format. Useful for saving web pages or HTML documents as portable PDF files.',
        type: 'paragraph',
      },
      {
        heading: 'Supported formats',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Input', 'Output', 'Max files', 'Max file size'],
          rows: [['HTML, HTM', 'PDF', '5', '50 MB per file']],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload your HTML file(s)',
          'Click "Convert" to start',
          'Download the PDF version',
        ],
      },
    ],
  },

  // ──────────────────────────────────────
  // CONVERT FROM PDF TOOLS
  // ──────────────────────────────────────
  {
    slug: 'pdf-to-image',
    title: 'PDF to Image',
    description: 'Convert PDF pages to PNG images.',
    category: 'tool-guide',
    toolCategory: 'CONVERT FROM PDF',
    toolId: 'pdf-to-image',
    sections: [
      {
        heading: 'What it does',
        content: 'PDF to Image converts each page of your PDF into a separate PNG image. Great for sharing individual pages as images or embedding in presentations.',
        type: 'paragraph',
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 5 PDF files',
          'Click "Convert" to process',
          'Download the resulting images',
        ],
      },
    ],
  },
  {
    slug: 'pdf-to-word',
    title: 'PDF to Word',
    description: 'Convert PDF documents to editable Word files.',
    category: 'tool-guide',
    toolCategory: 'CONVERT FROM PDF',
    toolId: 'pdf-to-word',
    sections: [
      {
        heading: 'What it does',
        content: 'PDF to Word converts your PDF documents into editable Microsoft Word (.docx) files. Text, formatting, and layout are preserved as closely as possible.',
        type: 'paragraph',
      },
      {
        heading: 'When to use it',
        content: '',
        type: 'steps',
        items: [
          'Editing content from a PDF you received',
          'Updating an old document where you only have the PDF',
          'Reformatting PDF content for a new purpose',
        ],
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 5 PDF files',
          'Click "Convert" to process',
          'Download the Word document(s)',
        ],
      },
      {
        heading: 'Tip',
        content: 'Complex layouts with many images or unusual fonts may not convert perfectly. For best results, use PDFs with simple, text-heavy layouts.',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'pdf-to-ppt',
    title: 'PDF to PowerPoint',
    description: 'Convert PDF files to PowerPoint presentations.',
    category: 'tool-guide',
    toolCategory: 'CONVERT FROM PDF',
    toolId: 'pdf-to-ppt',
    sections: [
      {
        heading: 'What it does',
        content: 'PDF to PowerPoint converts your PDF into an editable PowerPoint (.pptx) presentation. Each PDF page becomes a slide.',
        type: 'paragraph',
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 5 PDF files',
          'Click "Convert" to process',
          'Download the PowerPoint file(s)',
        ],
      },
    ],
  },
  {
    slug: 'pdf-to-excel',
    title: 'PDF to Excel',
    description: 'Extract tables from PDFs to Excel spreadsheets.',
    category: 'tool-guide',
    toolCategory: 'CONVERT FROM PDF',
    toolId: 'pdf-to-excel',
    sections: [
      {
        heading: 'What it does',
        content: 'PDF to Excel extracts tables and data from your PDF documents into editable Excel (.xlsx) spreadsheets.',
        type: 'paragraph',
      },
      {
        heading: 'When to use it',
        content: '',
        type: 'steps',
        items: [
          'Extracting data from financial reports in PDF format',
          'Converting tabular data for analysis in Excel',
          'Pulling numbers from invoices or statements',
        ],
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 5 PDF files',
          'Click "Convert" to process',
          'Download the Excel file(s)',
        ],
      },
    ],
  },
  {
    slug: 'pdf-to-text',
    title: 'PDF to Text',
    description: 'Extract plain text from PDF documents.',
    category: 'tool-guide',
    toolCategory: 'CONVERT FROM PDF',
    toolId: 'pdf-to-text',
    sections: [
      {
        heading: 'What it does',
        content: 'PDF to Text extracts all text content from your PDF and saves it as a plain text (.txt) file. Formatting is stripped, leaving just the raw text.',
        type: 'paragraph',
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 5 PDF files',
          'Click "Convert" to process',
          'Download the text file(s)',
        ],
      },
      {
        heading: 'Tip',
        content: 'For scanned PDFs, use the OCR tool first to add a searchable text layer, then convert to text.',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'pdf-to-pdfa',
    title: 'PDF to PDF/A',
    description: 'Convert PDFs to archival format for long-term storage.',
    category: 'tool-guide',
    toolCategory: 'CONVERT FROM PDF',
    toolId: 'pdf-to-pdfa',
    sections: [
      {
        heading: 'What it does',
        content: 'PDF to PDF/A converts your documents to PDF/A-2b format, an ISO standard designed for long-term archival. PDF/A files embed all fonts and metadata needed for faithful reproduction.',
        type: 'paragraph',
      },
      {
        heading: 'When to use it',
        content: '',
        type: 'steps',
        items: [
          'Archiving legal or compliance documents',
          'Submitting files to systems that require PDF/A format',
          'Ensuring documents remain readable years from now',
        ],
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 5 PDF files',
          'Click "Convert" to process',
          'Download the PDF/A file(s)',
        ],
      },
    ],
  },

  // ──────────────────────────────────────
  // EDIT PDF TOOLS
  // ──────────────────────────────────────
  {
    slug: 'rotate-pdf',
    title: 'Rotate Pages',
    description: 'Rotate PDF pages to the correct orientation.',
    category: 'tool-guide',
    toolCategory: 'EDIT PDF',
    toolId: 'rotate',
    sections: [
      {
        heading: 'What it does',
        content: 'Rotate Pages lets you rotate pages in your PDF by 90, 180, or 270 degrees. Apply rotation to all pages, odd pages only, or even pages only.',
        type: 'paragraph',
      },
      {
        heading: 'Options',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Option', 'Description'],
          rows: [
            ['Rotation angle', '90°, 180°, or 270° clockwise'],
            ['Apply to', 'All pages, odd pages only, or even pages only'],
          ],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload a PDF file',
          'Select the rotation angle and which pages to rotate',
          'Click "Rotate" to process',
          'Download the rotated PDF',
        ],
      },
    ],
  },
  {
    slug: 'add-page-numbers',
    title: 'Add Page Numbers',
    description: 'Add page numbers to your PDF document.',
    category: 'tool-guide',
    toolCategory: 'EDIT PDF',
    toolId: 'add-page-numbers',
    sections: [
      {
        heading: 'What it does',
        content: 'Add Page Numbers inserts page numbering onto each page of your PDF. Choose the position, starting number, font size, and format.',
        type: 'paragraph',
      },
      {
        heading: 'Options',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Option', 'Description'],
          rows: [
            ['Position', 'Where to place the number on each page'],
            ['Start number', 'The first page number (default: 1)'],
            ['Font size', 'Size of the page number text'],
            ['Format', 'Numbering format (e.g., "1", "Page 1", "1/N")'],
          ],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload a PDF file',
          'Configure position, starting number, and format',
          'Click "Add Numbers" to process',
          'Download the numbered PDF',
        ],
      },
    ],
  },
  {
    slug: 'add-watermark',
    title: 'Add Watermark',
    description: 'Add text or image watermarks to your PDFs.',
    category: 'tool-guide',
    toolCategory: 'EDIT PDF',
    toolId: 'watermark',
    sections: [
      {
        heading: 'What it does',
        content: 'Add Watermark places text or image watermarks on your PDF pages. Customize the position, opacity, size, and appearance.',
        type: 'paragraph',
      },
      {
        heading: 'Options',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Option', 'Description'],
          rows: [
            ['Type', 'Text watermark or image watermark'],
            ['Position', 'Center, diagonal, or tiled across the page'],
            ['Opacity', 'Transparency level (0-100%)'],
            ['Font size / Scale', 'Size of the watermark text or image'],
          ],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 10 PDF files',
          'Choose text or image watermark and configure options',
          'Click "Add Watermark" to process',
          'Download the watermarked PDF(s)',
        ],
      },
    ],
  },
  {
    slug: 'edit-pdf',
    title: 'Edit PDF',
    description: 'Add text annotations to PDF documents.',
    category: 'tool-guide',
    toolCategory: 'EDIT PDF',
    toolId: 'edit-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'Edit PDF lets you add text annotations to your PDF documents. Place text at specific positions on any page.',
        type: 'paragraph',
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload a PDF file',
          'Add text annotations with position, page, and font size settings',
          'Click "Apply" to process',
          'Download the edited PDF',
        ],
      },
    ],
  },

  // ──────────────────────────────────────
  // SECURITY TOOLS
  // ──────────────────────────────────────
  {
    slug: 'unlock-pdf',
    title: 'Unlock PDF',
    description: 'Remove password protection from PDF documents.',
    category: 'tool-guide',
    toolCategory: 'PDF SECURITY',
    toolId: 'unlock-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'Unlock PDF removes password protection from your PDF documents. You need to know the current password to unlock the file.',
        type: 'paragraph',
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 10 password-protected PDFs',
          'Enter the current password',
          'Click "Unlock" to remove protection',
          'Download the unlocked PDF(s)',
        ],
      },
      {
        heading: 'Tip',
        content: 'You must know the document password to unlock it. This tool cannot bypass unknown passwords.',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'protect-pdf',
    title: 'Protect PDF',
    description: 'Add password protection to PDF documents.',
    category: 'tool-guide',
    toolCategory: 'PDF SECURITY',
    toolId: 'password-protect',
    sections: [
      {
        heading: 'What it does',
        content: 'Protect PDF adds password encryption to your documents. You can also set permissions to control printing, copying, and editing.',
        type: 'paragraph',
      },
      {
        heading: 'Options',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Option', 'Description'],
          rows: [
            ['Password', 'Set a password to open the document'],
            ['Allow print', 'Enable or disable printing'],
            ['Allow copy', 'Enable or disable text copying'],
            ['Allow edit', 'Enable or disable editing'],
          ],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 10 PDF files',
          'Set a password and choose permissions',
          'Click "Protect" to apply encryption',
          'Download the protected PDF(s)',
        ],
      },
    ],
  },
  {
    slug: 'sign-pdf',
    title: 'Sign PDF',
    description: 'Add your signature to PDF documents.',
    category: 'tool-guide',
    toolCategory: 'PDF SECURITY',
    toolId: 'sign-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'Sign PDF lets you add a visual signature to your documents. Draw or upload your signature and place it on any page.',
        type: 'paragraph',
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload a PDF file',
          'Draw or upload your signature',
          'Position it on the desired page',
          'Click "Sign" to apply',
          'Download the signed PDF',
        ],
      },
      {
        heading: 'Tip',
        content: 'This adds a visual signature image. For legally binding digital signatures with certificates, use dedicated e-signature software.',
        type: 'tip',
      },
    ],
  },

  // ──────────────────────────────────────
  // CONCEPTS
  // ──────────────────────────────────────
  {
    slug: 'supported-formats',
    title: 'Supported Formats',
    description: 'A complete list of file formats supported by EsyDocs tools.',
    category: 'concept',
    sections: [
      {
        heading: 'Document formats',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Format', 'Extensions', 'Used in'],
          rows: [
            ['PDF', '.pdf', 'All tools'],
            ['Microsoft Word', '.doc, .docx', 'Word to PDF, PDF to Word'],
            ['Microsoft Excel', '.xls, .xlsx', 'Excel to PDF, PDF to Excel'],
            ['Microsoft PowerPoint', '.ppt, .pptx', 'PowerPoint to PDF, PDF to PowerPoint'],
            ['HTML', '.html, .htm', 'HTML to PDF, PDF to HTML'],
            ['Plain Text', '.txt', 'PDF to Text'],
          ],
        },
      },
      {
        heading: 'Image formats',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Format', 'Extensions', 'Used in'],
          rows: [
            ['JPEG', '.jpg, .jpeg', 'Image to PDF, Scan to PDF'],
            ['PNG', '.png', 'Image to PDF, Scan to PDF, PDF to Image'],
            ['WebP', '.webp', 'Image to PDF, Scan to PDF'],
          ],
        },
      },
      {
        heading: 'Archival formats',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Format', 'Standard', 'Used in'],
          rows: [
            ['PDF/A-2b', 'ISO 19005-2', 'PDF to PDF/A'],
          ],
        },
      },
    ],
  },
  {
    slug: 'file-limits',
    title: 'File Limits',
    description: 'Maximum file sizes, file counts, and other limits for each tool.',
    category: 'concept',
    sections: [
      {
        heading: 'Limits by tool',
        content: 'Each tool has specific limits on file size and number of files you can process at once.',
        type: 'table',
        tableData: {
          headers: ['Tool', 'Max file size', 'Max files'],
          rows: [
            ['Merge PDF', '50 MB', '20'],
            ['Split PDF', '50 MB', '1'],
            ['Compress PDF', '50 MB', '10'],
            ['OCR PDF', '50 MB', '5'],
            ['Image to PDF', '20 MB', '20'],
            ['Scan to PDF', '20 MB', '20'],
            ['Word/Excel/PPT to PDF', '50 MB', '5'],
            ['PDF to Word/Excel/PPT/Image/Text', '50 MB', '5'],
            ['Watermark/Protect/Unlock', '50 MB', '10'],
            ['Other tools', '50 MB', '1'],
          ],
        },
      },
      {
        heading: 'Guest vs. registered limits',
        content: 'Guest users can process files without an account, but files expire after 2 hours. Registered users get longer retention and may have access to higher limits depending on their plan.',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'security-privacy',
    title: 'Security & Privacy',
    description: 'How EsyDocs keeps your files safe and private.',
    category: 'concept',
    sections: [
      {
        heading: 'File handling',
        content: 'Your files are uploaded securely to our servers for processing. We use encrypted connections (HTTPS) for all file transfers.',
        type: 'paragraph',
      },
      {
        heading: 'Automatic deletion',
        content: 'All uploaded and processed files are automatically deleted from our servers. Guest files expire after 2 hours. We never store files longer than necessary.',
        type: 'paragraph',
      },
      {
        heading: 'What we don\'t do',
        content: '',
        type: 'steps',
        items: [
          'We never read or analyze your document content',
          'We never share your files with third parties',
          'We never use your files for training or any other purpose',
          'We never sell or monetize your data',
        ],
      },
      {
        heading: 'Server security',
        content: 'Our servers are secured with industry-standard practices including firewalls, access controls, and regular security audits. All processing happens in isolated environments.',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'accounts-plans',
    title: 'Accounts & Plans',
    description: 'Learn about guest access, free accounts, and plans.',
    category: 'concept',
    sections: [
      {
        heading: 'Guest access',
        content: 'You can use EsyDocs without an account. Guest sessions use a temporary token, and your files are automatically deleted after 2 hours.',
        type: 'paragraph',
      },
      {
        heading: 'Free account',
        content: 'Create a free account for longer file retention, job history, and a consistent experience across devices. Sign up with just an email and password.',
        type: 'paragraph',
      },
      {
        heading: 'Comparison',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Feature', 'Guest', 'Free Account'],
          rows: [
            ['All tools', 'Yes', 'Yes'],
            ['File retention', '2 hours', 'Longer'],
            ['Job history', 'No', 'Yes'],
            ['Account required', 'No', 'Yes'],
          ],
        },
      },
    ],
  },

  // ──────────────────────────────────────
  // FAQ
  // ──────────────────────────────────────
  {
    slug: 'faq',
    title: 'Frequently Asked Questions',
    description: 'Common questions about using EsyDocs.',
    category: 'faq',
    sections: [
      {
        heading: 'Is EsyDocs free?',
        content: 'Yes, all tools on EsyDocs are free to use. You can process files as a guest without creating an account.',
        type: 'paragraph',
      },
      {
        heading: 'Are my files safe?',
        content: 'Yes. All files are transferred over encrypted connections and automatically deleted after processing. We never read, share, or store your files beyond what\'s needed for processing.',
        type: 'paragraph',
      },
      {
        heading: 'Do I need to create an account?',
        content: 'No. You can use all tools as a guest. Creating a free account gives you longer file retention and job history.',
        type: 'paragraph',
      },
      {
        heading: 'What\'s the maximum file size?',
        content: 'Most tools support files up to 50 MB. Image-based tools (Image to PDF, Scan to PDF) support up to 20 MB per file. See the File Limits page for details.',
        type: 'paragraph',
      },
      {
        heading: 'How long are my files stored?',
        content: 'Guest files are automatically deleted after 2 hours. Registered users get longer retention depending on their plan.',
        type: 'paragraph',
      },
      {
        heading: 'Can I process multiple files at once?',
        content: 'Yes, most tools support batch processing. The number of files you can upload at once varies by tool — check the tool page or the File Limits page for specifics.',
        type: 'paragraph',
      },
      {
        heading: 'What browsers are supported?',
        content: 'EsyDocs works in all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version for the best experience.',
        type: 'paragraph',
      },
      {
        heading: 'My conversion didn\'t look right. What can I do?',
        content: 'Complex layouts with unusual fonts, embedded graphics, or heavy formatting may not convert perfectly. For best results, use documents with simple layouts. If the issue persists, try a different quality setting or contact us.',
        type: 'paragraph',
      },
    ],
  },
];

// ============================================================================
// HELPERS
// ============================================================================

export const getDocBySlug = (slug: string): DocEntry | undefined => {
  return docs.find((doc) => doc.slug === slug);
};

export const getDocsByCategory = (category: DocCategory): DocEntry[] => {
  return docs.filter((doc) => doc.category === category);
};
