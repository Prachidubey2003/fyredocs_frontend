import type { DocSection } from '@/config/docs';

// ============================================================================
// DEVELOPER DOCS - Super-admin only
// ============================================================================

export interface DevDocEntry {
  slug: string;
  title: string;
  description: string;
  category: DevDocCategory;
  sections: DocSection[];
}

export type DevDocCategory =
  | 'overview'
  | 'api'
  | 'services'
  | 'architecture'
  | 'guides';

export interface DevDocNavGroup {
  title: string;
  color: string;
  items: { slug: string; title: string }[];
}

export const devDocNavGroups: DevDocNavGroup[] = [
  {
    title: 'Overview',
    color: 'text-primary',
    items: [
      { slug: 'architecture', title: 'Architecture Overview' },
      { slug: 'getting-started', title: 'Local Setup' },
      { slug: 'request-flow', title: 'Request Flow' },
    ],
  },
  {
    title: 'API Reference',
    color: 'text-blue-500',
    items: [
      { slug: 'api-auth', title: 'Auth API' },
      { slug: 'api-upload', title: 'Upload API' },
      { slug: 'api-jobs', title: 'Jobs API' },
      { slug: 'api-convert-to-pdf', title: 'Convert to PDF API' },
      { slug: 'api-convert-from-pdf', title: 'Convert from PDF API' },
      { slug: 'api-organize-pdf', title: 'Organize PDF API' },
      { slug: 'api-optimize-pdf', title: 'Optimize PDF API' },
    ],
  },
  {
    title: 'Services',
    color: 'text-orange-500',
    items: [
      { slug: 'svc-api-gateway', title: 'API Gateway' },
      { slug: 'svc-auth', title: 'Auth Service' },
      { slug: 'svc-job', title: 'Job Service' },
      { slug: 'svc-convert-to-pdf', title: 'Convert to PDF' },
      { slug: 'svc-convert-from-pdf', title: 'Convert from PDF' },
      { slug: 'svc-organize-pdf', title: 'Organize PDF' },
      { slug: 'svc-optimize-pdf', title: 'Optimize PDF' },
      { slug: 'svc-analytics', title: 'Analytics Service' },
      { slug: 'svc-cleanup', title: 'Cleanup Worker' },
    ],
  },
  {
    title: 'Architecture',
    color: 'text-purple-500',
    items: [
      { slug: 'arch-redis', title: 'Redis Architecture' },
      { slug: 'arch-base-image', title: 'Base Image Setup' },
      { slug: 'arch-db-practices', title: 'DB Best Practices' },
    ],
  },
  {
    title: 'Guides',
    color: 'text-green-500',
    items: [
      { slug: 'guide-hardening', title: 'Backend Hardening' },
      { slug: 'guide-deployment', title: 'Deployment Review' },
    ],
  },
];

// ============================================================================
// DEVELOPER DOCS CONTENT
// ============================================================================

export const developerDocs: DevDocEntry[] = [
  // ── Overview ──────────────────────────
  {
    slug: 'architecture',
    title: 'Architecture Overview',
    description: 'High-level system architecture and microservice boundaries.',
    category: 'overview',
    sections: [
      {
        heading: 'Microservices Architecture',
        content: 'EsyDocs uses a true microservices architecture. Each service is independently deployable with its own database, configuration, and API contract. No cross-service imports or shared business logic.',
        type: 'paragraph',
      },
      {
        heading: 'Services',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Service', 'Port', 'Description'],
          rows: [
            ['API Gateway', '8080', 'Central entry point — CORS, auth middleware, reverse proxy'],
            ['Job Service', '8081', 'Job orchestration, file uploads, job lifecycle management'],
            ['Convert From PDF', '8082', 'PDF → Word, Excel, PPT, Image, HTML, Text conversions'],
            ['Convert To PDF', '8083', 'Word, Excel, PPT, HTML, Image → PDF conversions'],
            ['Organize PDF', '8084', 'Merge, split, rotate, extract, watermark, sign, edit'],
            ['Optimize PDF', '8085', 'Compress, repair, OCR operations'],
            ['Auth Service', '8086', 'User registration, login, JWT token management'],
            ['Analytics Service', '8087', 'Usage metrics and analytics tracking'],
            ['Cleanup Worker', '—', 'Background worker for expired file/job cleanup'],
          ],
        },
      },
      {
        heading: 'Communication patterns',
        content: '',
        type: 'steps',
        items: [
          'Client → Services: All traffic flows through the API Gateway via REST',
          'Service → Service: NATS JetStream for async job processing',
          'Caching/State: Redis for upload chunks, rate limiting, guest tokens',
          'Persistence: PostgreSQL (each service owns its own schema)',
        ],
      },
      {
        heading: 'Tech stack',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Layer', 'Technology'],
          rows: [
            ['Backend', 'Go 1.25, Gin framework'],
            ['Database', 'PostgreSQL 15, GORM'],
            ['Cache', 'Redis 7'],
            ['Message Queue', 'NATS JetStream'],
            ['Doc Processing', 'LibreOffice, pdfcpu, Poppler, Ghostscript, Tesseract OCR'],
            ['Frontend', 'React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui'],
            ['Auth', 'JWT (HS256) with HTTP-only cookies'],
            ['Observability', 'OpenTelemetry, Prometheus, structured logging (slog)'],
          ],
        },
      },
    ],
  },
  {
    slug: 'getting-started',
    title: 'Local Development Setup',
    description: 'Set up your local development environment.',
    category: 'overview',
    sections: [
      {
        heading: 'Prerequisites',
        content: '',
        type: 'steps',
        items: [
          'Go 1.25+',
          'Docker & Docker Compose',
          'PostgreSQL 15',
          'Redis 7',
          'NATS Server with JetStream',
          'LibreOffice, Ghostscript, Poppler, Tesseract OCR (for document processing services)',
        ],
      },
      {
        heading: 'Quick start',
        content: 'Clone the repo and set up:\n1. git clone <repo-url> && cd esydocs/esydocs_backend\n2. cp .env.example .env (edit with local settings)\n3. docker compose -f deployment/docker-compose.essentials.yml up -d\n4. cd api-gateway && go run main.go\n5. Or start everything: ./deploy.sh',
        type: 'paragraph',
      },
      {
        heading: 'Running tests',
        content: 'Run tests for a specific service: cd job-service && go test ./... — or iterate over all service directories.',
        type: 'paragraph',
      },
      {
        heading: 'Project rules',
        content: 'All development must follow the rules in CLAUDE.md — this includes microservice boundaries, standard response format, mandatory documentation updates, and mandatory test updates after every code change.',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'request-flow',
    title: 'Request Flow',
    description: 'How a request travels through the system from browser to result.',
    category: 'overview',
    sections: [
      {
        heading: 'Routing',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Route prefix', 'Target service', 'Purpose'],
          rows: [
            ['/auth/*', 'Auth Service (8086)', 'Authentication endpoints'],
            ['/api/upload/*', 'Job Service (8081)', 'Chunked file upload'],
            ['/api/jobs/*', 'Job Service (8081)', 'Job management'],
            ['/api/convert-from-pdf/*', 'Job Service (8081)', 'PDF conversions'],
            ['/api/convert-to-pdf/*', 'Job Service (8081)', 'Document to PDF'],
            ['/api/organize-pdf/*', 'Job Service (8081)', 'PDF manipulation'],
            ['/api/optimize-pdf/*', 'Job Service (8081)', 'PDF optimization'],
            ['/api/analytics/*', 'Analytics Service (8087)', 'Analytics data'],
          ],
        },
      },
      {
        heading: 'Job lifecycle',
        content: '',
        type: 'steps',
        items: [
          'Client initiates chunked file upload → API Gateway → Job Service',
          'Job Service stores chunks in Redis, assembles file on completion',
          'Job Service creates ProcessingJob record in PostgreSQL',
          'Job Service publishes event to NATS JetStream (tool-specific queue)',
          'Worker service consumes event and processes the file',
          'Worker updates job status (progress, completion, failure)',
          'Client polls for status or connects via SSE',
          'Client downloads output file from Job Service',
        ],
      },
      {
        heading: 'Security layers',
        content: '',
        type: 'steps',
        items: [
          'CORS enforcement at API Gateway',
          'JWT token validation (HS256) — via cookie or Authorization header',
          'Guest token support (X-Guest-Token header) for unauthenticated users',
          'Request body size limiting (1 MB for non-uploads)',
          'Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection',
        ],
      },
    ],
  },

  // ── API Reference ─────────────────────
  {
    slug: 'api-auth',
    title: 'Auth API',
    description: 'Authentication and user management endpoints.',
    category: 'api',
    sections: [
      {
        heading: 'Endpoints',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Method', 'Path', 'Description'],
          rows: [
            ['POST', '/auth/signup', 'Register a new user'],
            ['POST', '/auth/login', 'Login and receive JWT tokens'],
            ['POST', '/auth/logout', 'Clear session tokens'],
            ['POST', '/auth/refresh', 'Refresh access token using refresh token'],
            ['GET', '/auth/me', 'Get current user profile'],
          ],
        },
      },
      {
        heading: 'Authentication methods',
        content: '',
        type: 'steps',
        items: [
          'HTTP-only Cookie (Recommended): Cookie name "access_token", automatically set on login/signup',
          'Authorization Header: Bearer <JWT_TOKEN>',
          'Guest Mode: X-Guest-Token header or cookie — jobs expire after 2 hours',
        ],
      },
      {
        heading: 'JWT claims',
        content: 'Tokens include: sub (user ID), email, role (user/admin/super-admin), plan (anonymous/free/pro), iss, aud, exp, iat.',
        type: 'paragraph',
      },
      {
        content: 'Full specification: docs/developer/api/AUTH_API.md',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'api-upload',
    title: 'Upload API',
    description: 'Chunked file upload endpoints.',
    category: 'api',
    sections: [
      {
        heading: 'Endpoints',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Method', 'Path', 'Description'],
          rows: [
            ['POST', '/api/upload/init', 'Initialize a chunked upload session'],
            ['POST', '/api/upload/chunk', 'Upload a single chunk'],
            ['POST', '/api/upload/complete', 'Finalize upload and assemble file'],
            ['GET', '/api/upload/status/:uploadId', 'Check upload progress'],
          ],
        },
      },
      {
        heading: 'How chunked upload works',
        content: '',
        type: 'steps',
        items: [
          'Client calls /init with filename, fileSize, and toolType → receives uploadId and chunkSize',
          'Client splits file into chunks and uploads each via /chunk with uploadId and chunkIndex',
          'Chunks are stored in Redis with TTL',
          'Client calls /complete → Job Service assembles chunks into final file',
          'Returns fileId for use in job creation',
        ],
      },
      {
        content: 'Full specification: docs/developer/api/UPLOAD_API.md',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'api-jobs',
    title: 'Jobs API',
    description: 'Job creation, status, and download endpoints.',
    category: 'api',
    sections: [
      {
        heading: 'Endpoints',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Method', 'Path', 'Description'],
          rows: [
            ['POST', '/api/jobs', 'Create a new processing job'],
            ['GET', '/api/jobs/:jobId', 'Get job status'],
            ['GET', '/api/jobs/:jobId/download', 'Download job output'],
            ['GET', '/api/jobs', 'List user\'s jobs'],
            ['DELETE', '/api/jobs/:jobId', 'Cancel/delete a job'],
          ],
        },
      },
      {
        heading: 'Job states',
        content: '',
        type: 'table',
        tableData: {
          headers: ['State', 'Description'],
          rows: [
            ['pending', 'Job created, not yet submitted to queue'],
            ['queued', 'Submitted to NATS, waiting for worker'],
            ['processing', 'Worker is actively processing'],
            ['completed', 'Finished successfully, output available for download'],
            ['failed', 'Processing failed (may be retryable)'],
          ],
        },
      },
      {
        content: 'Full specification: docs/developer/api/JOBS_API.md',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'api-convert-to-pdf',
    title: 'Convert to PDF API',
    description: 'Endpoints for converting documents to PDF format.',
    category: 'api',
    sections: [
      {
        heading: 'Tool types',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Tool type', 'Input formats', 'Description'],
          rows: [
            ['word-to-pdf', 'DOC, DOCX', 'Convert Word documents to PDF'],
            ['excel-to-pdf', 'XLS, XLSX', 'Convert Excel spreadsheets to PDF'],
            ['powerpoint-to-pdf', 'PPT, PPTX', 'Convert presentations to PDF'],
            ['html-to-pdf', 'HTML, HTM', 'Convert HTML files to PDF'],
            ['image-to-pdf', 'JPG, PNG, WebP', 'Convert images to PDF'],
          ],
        },
      },
      {
        heading: 'Processing',
        content: 'Conversions are handled by the Convert to PDF service (port 8083) using LibreOffice for office documents. Jobs are dispatched via NATS JetStream.',
        type: 'paragraph',
      },
      {
        content: 'Full specification: docs/developer/api/CONVERT_TO_PDF_API.md',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'api-convert-from-pdf',
    title: 'Convert from PDF API',
    description: 'Endpoints for converting PDF to other formats.',
    category: 'api',
    sections: [
      {
        heading: 'Tool types',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Tool type', 'Output format', 'Description'],
          rows: [
            ['pdf-to-word / pdf-to-docx', 'DOCX', 'Convert PDF to Word'],
            ['pdf-to-excel / pdf-to-xlsx', 'XLSX', 'Extract tables from PDF'],
            ['pdf-to-powerpoint / pdf-to-pptx', 'PPTX', 'Convert PDF to presentation'],
            ['pdf-to-image / pdf-to-img', 'PNG', 'Convert pages to images'],
            ['pdf-to-html', 'HTML', 'Convert PDF to HTML'],
            ['pdf-to-text / pdf-to-txt', 'TXT', 'Extract text from PDF'],
            ['pdf-to-pdfa', 'PDF/A-2b', 'Convert to archival format'],
          ],
        },
      },
      {
        content: 'Full specification: docs/developer/api/CONVERT_FROM_PDF_API.md',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'api-organize-pdf',
    title: 'Organize PDF API',
    description: 'Endpoints for PDF manipulation operations.',
    category: 'api',
    sections: [
      {
        heading: 'Tool types',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Tool type', 'Description'],
          rows: [
            ['merge-pdf', 'Combine multiple PDFs into one'],
            ['split-pdf', 'Split PDF by page ranges or equal chunks'],
            ['rotate-pdf', 'Rotate pages by 90/180/270 degrees'],
            ['remove-pages', 'Remove specific pages'],
            ['extract-pages', 'Extract specific pages into new PDF'],
            ['organize-pdf', 'Reorder pages'],
            ['watermark-pdf', 'Add text or image watermarks'],
            ['protect-pdf', 'Add password encryption'],
            ['unlock-pdf', 'Remove password protection'],
            ['sign-pdf', 'Add visual signature'],
            ['edit-pdf', 'Add text annotations'],
            ['add-page-numbers', 'Insert page numbering'],
            ['scan-to-pdf', 'Convert scanned images to PDF'],
          ],
        },
      },
      {
        content: 'Full specification: docs/developer/api/ORGANIZE_PDF_API.md',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'api-optimize-pdf',
    title: 'Optimize PDF API',
    description: 'Endpoints for PDF optimization operations.',
    category: 'api',
    sections: [
      {
        heading: 'Tool types',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Tool type', 'Description'],
          rows: [
            ['compress-pdf', 'Reduce file size (quality levels: low, medium, high, extreme)'],
            ['repair-pdf', 'Fix corrupted/damaged PDFs'],
            ['ocr-pdf', 'Add searchable text layer (language + DPI options)'],
          ],
        },
      },
      {
        content: 'Full specification: docs/developer/api/OPTIMIZE_PDF_API.md',
        type: 'tip',
      },
    ],
  },

  // ── Services ──────────────────────────
  {
    slug: 'svc-api-gateway',
    title: 'API Gateway',
    description: 'Central entry point for all client requests.',
    category: 'services',
    sections: [
      {
        heading: 'Responsibility',
        content: 'The API Gateway is the single entry point for all client traffic. It handles CORS, authentication verification, request routing, rate limiting, and security headers.',
        type: 'paragraph',
      },
      {
        heading: 'Key behaviors',
        content: '',
        type: 'steps',
        items: [
          'Validates JWT tokens (from cookies or Authorization header)',
          'Issues and validates guest tokens for unauthenticated users',
          'Enforces CORS policies from environment configuration',
          'Reverse-proxies requests to the appropriate backend service',
          'Applies request body size limits (1 MB for non-upload requests)',
          'Sets security headers on all responses',
        ],
      },
      {
        content: 'Full docs: docs/developer/services/API_GATEWAY.md',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'svc-auth',
    title: 'Auth Service',
    description: 'User registration, login, and token management.',
    category: 'services',
    sections: [
      {
        heading: 'Responsibility',
        content: 'Manages user accounts, authentication, and JWT token lifecycle. Owns the users, auth_metadata, subscription_plans, and user_sessions tables.',
        type: 'paragraph',
      },
      {
        heading: 'Database tables',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Table', 'Purpose'],
          rows: [
            ['users', 'User profiles (email, name, role, plan)'],
            ['auth_metadata', 'OAuth provider tracking'],
            ['subscription_plans', 'Plan definitions (anonymous, free, pro)'],
            ['user_sessions', 'Active session/token tracking'],
          ],
        },
      },
      {
        content: 'Full docs: docs/developer/services/AUTH_SERVICE.md',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'svc-job',
    title: 'Job Service',
    description: 'Job orchestration, file uploads, and job lifecycle.',
    category: 'services',
    sections: [
      {
        heading: 'Responsibility',
        content: 'The Job Service is the central orchestrator. It handles chunked file uploads, creates processing jobs, dispatches work to NATS queues, and serves job status and downloads.',
        type: 'paragraph',
      },
      {
        heading: 'Key responsibilities',
        content: '',
        type: 'steps',
        items: [
          'Chunked upload management (init, chunk, complete) via Redis',
          'Job CRUD operations with PostgreSQL',
          'Tool-to-service routing (maps tool types to NATS subjects)',
          'SSE endpoint for real-time status updates',
          'File download serving',
        ],
      },
      {
        heading: 'Database tables',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Table', 'Purpose'],
          rows: [
            ['processing_jobs', 'Job records (status, tool_type, progress, metadata)'],
            ['file_metadata', 'Input/output file records linked to jobs'],
          ],
        },
      },
      {
        content: 'Full docs: docs/developer/services/JOB_SERVICE.md',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'svc-convert-to-pdf',
    title: 'Convert to PDF Service',
    description: 'Converts office documents and images to PDF.',
    category: 'services',
    sections: [
      {
        heading: 'Responsibility',
        content: 'Consumes jobs from NATS JetStream and converts documents (Word, Excel, PowerPoint, HTML, images) to PDF format using LibreOffice.',
        type: 'paragraph',
      },
      {
        heading: 'Supported conversions',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Tool type', 'Engine'],
          rows: [
            ['word-to-pdf', 'LibreOffice'],
            ['excel-to-pdf', 'LibreOffice'],
            ['powerpoint-to-pdf', 'LibreOffice'],
            ['html-to-pdf', 'LibreOffice'],
            ['image-to-pdf', 'pdfcpu'],
          ],
        },
      },
      {
        content: 'Full docs: docs/developer/services/CONVERT_TO_PDF.md',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'svc-convert-from-pdf',
    title: 'Convert from PDF Service',
    description: 'Converts PDF to other document formats.',
    category: 'services',
    sections: [
      {
        heading: 'Responsibility',
        content: 'Consumes jobs from NATS JetStream and converts PDFs to various output formats using LibreOffice, Poppler, and Ghostscript.',
        type: 'paragraph',
      },
      {
        heading: 'Supported conversions',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Tool type', 'Output', 'Engine'],
          rows: [
            ['pdf-to-word', 'DOCX', 'LibreOffice'],
            ['pdf-to-excel', 'XLSX', 'LibreOffice'],
            ['pdf-to-powerpoint', 'PPTX', 'LibreOffice'],
            ['pdf-to-image', 'PNG', 'Poppler (pdftoppm)'],
            ['pdf-to-html', 'HTML', 'Poppler (pdftohtml)'],
            ['pdf-to-text', 'TXT', 'Poppler (pdftotext)'],
            ['pdf-to-pdfa', 'PDF/A-2b', 'Ghostscript'],
          ],
        },
      },
      {
        content: 'Full docs: docs/developer/services/CONVERT_FROM_PDF.md',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'svc-organize-pdf',
    title: 'Organize PDF Service',
    description: 'PDF manipulation — merge, split, rotate, watermark, sign, edit.',
    category: 'services',
    sections: [
      {
        heading: 'Responsibility',
        content: 'Handles all PDF manipulation operations using pdfcpu. Consumes jobs from NATS JetStream.',
        type: 'paragraph',
      },
      {
        heading: 'Operations',
        content: 'Merge, split, rotate, remove pages, extract pages, reorder, watermark (text/image), password protect, unlock, sign, edit (text annotations), add page numbers, scan to PDF.',
        type: 'paragraph',
      },
      {
        content: 'Full docs: docs/developer/services/ORGANIZE_PDF.md',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'svc-optimize-pdf',
    title: 'Optimize PDF Service',
    description: 'PDF compression, repair, and OCR.',
    category: 'services',
    sections: [
      {
        heading: 'Responsibility',
        content: 'Handles PDF optimization operations. Compression uses Ghostscript with quality presets. OCR uses Tesseract. Repair uses pdfcpu.',
        type: 'paragraph',
      },
      {
        heading: 'Operations',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Operation', 'Engine', 'Notes'],
          rows: [
            ['Compress', 'Ghostscript', '4 quality levels: low, medium, high, extreme'],
            ['OCR', 'Tesseract', 'Configurable language and DPI (150-600)'],
            ['Repair', 'pdfcpu', 'Attempts to fix corrupted PDF structure'],
          ],
        },
      },
      {
        content: 'Full docs: docs/developer/services/OPTIMIZE_PDF.md',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'svc-analytics',
    title: 'Analytics Service',
    description: 'Usage metrics and analytics tracking.',
    category: 'services',
    sections: [
      {
        heading: 'Responsibility',
        content: 'Tracks usage metrics, job statistics, and system health data. Powers the admin dashboard with business, growth, engagement, reliability, and system performance metrics.',
        type: 'paragraph',
      },
      {
        content: 'Full docs: docs/developer/services/ANALYTICS_SERVICE.md',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'svc-cleanup',
    title: 'Cleanup Worker',
    description: 'Background worker for expired file and job cleanup.',
    category: 'services',
    sections: [
      {
        heading: 'Responsibility',
        content: 'Runs on a schedule to clean up expired files and jobs. Removes files from disk and marks expired jobs in the database.',
        type: 'paragraph',
      },
      {
        heading: 'Cleanup rules',
        content: '',
        type: 'steps',
        items: [
          'Guest job files: deleted after 2 hours',
          'Registered user files: deleted based on plan retention period',
          'Failed jobs: cleaned up after a configurable period',
          'Orphaned files (no associated job): cleaned up on each run',
        ],
      },
      {
        content: 'Full docs: docs/developer/services/CLEANUP_WORKER.md',
        type: 'tip',
      },
    ],
  },

  // ── Architecture ──────────────────────
  {
    slug: 'arch-redis',
    title: 'Redis Architecture',
    description: 'Redis data structures, caching patterns, and key namespaces.',
    category: 'architecture',
    sections: [
      {
        heading: 'Usage areas',
        content: '',
        type: 'steps',
        items: [
          'Chunked upload state: stores chunk metadata and assembled status with TTL',
          'Rate limiting: sliding window counters per IP/user',
          'Guest tokens: temporary session tokens for unauthenticated users',
          'Job status caching: short-lived cache for frequently polled job statuses',
        ],
      },
      {
        content: 'Full docs: docs/developer/architecture/REDIS_ARCHITECTURE.md',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'arch-base-image',
    title: 'Base Image Setup',
    description: 'Docker base image configuration for processing services.',
    category: 'architecture',
    sections: [
      {
        heading: 'Overview',
        content: 'Processing services (convert-to-pdf, convert-from-pdf, organize-pdf, optimize-pdf) require system-level tools like LibreOffice, Ghostscript, Poppler, and Tesseract. These are bundled in a shared base Docker image.',
        type: 'paragraph',
      },
      {
        heading: 'Included tools',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Tool', 'Used for'],
          rows: [
            ['LibreOffice', 'Office document conversions (Word, Excel, PPT, HTML)'],
            ['Ghostscript', 'PDF compression, PDF/A conversion'],
            ['Poppler', 'PDF to image/text/HTML conversion'],
            ['Tesseract OCR', 'Optical character recognition'],
            ['pdfcpu', 'PDF manipulation (merge, split, rotate, etc.)'],
          ],
        },
      },
      {
        content: 'Full docs: docs/developer/architecture/BASE_IMAGE_SETUP.md',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'arch-db-practices',
    title: 'Database Best Practices',
    description: 'PostgreSQL design patterns and conventions.',
    category: 'architecture',
    sections: [
      {
        heading: 'Key practices',
        content: '',
        type: 'steps',
        items: [
          'Each service owns its own database schema — no cross-service DB access',
          'Use UUIDs as primary keys',
          'Add indexes on frequently queried columns (status, user_id, created_at, expires_at)',
          'Use JSONB for flexible metadata storage',
          'GORM AutoMigrate for schema management in development',
          'Soft deletes where appropriate (track deletion without losing data)',
        ],
      },
      {
        content: 'Full docs: docs/developer/DB_BEST_PRACTICES.md',
        type: 'tip',
      },
    ],
  },

  // ── Guides ────────────────────────────
  {
    slug: 'guide-hardening',
    title: 'Backend Hardening',
    description: 'Security hardening guidelines for production deployment.',
    category: 'guides',
    sections: [
      {
        heading: 'Hardening areas',
        content: '',
        type: 'steps',
        items: [
          'CORS configuration: restrict origins to production domains',
          'JWT secret rotation and minimum key length (32+ characters)',
          'Rate limiting per IP and per user',
          'Request body size limits',
          'Security headers (HSTS, CSP, X-Frame-Options)',
          'File upload validation (type, size, content)',
          'Database connection pooling and timeout configuration',
          'Log sanitization (no secrets in logs)',
        ],
      },
      {
        content: 'Full docs: docs/developer/backend-hardening.md',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'guide-deployment',
    title: 'Deployment Review',
    description: 'Pre-deployment checklist and review process.',
    category: 'guides',
    sections: [
      {
        heading: 'Checklist',
        content: '',
        type: 'steps',
        items: [
          'All tests pass: go test ./... for each service',
          'No lint errors: go vet ./...',
          'Documentation updated (service docs, API docs, diagrams)',
          'Database migrations are safe (no data loss, backward compatible)',
          'Environment variables documented and configured',
          'Docker images build successfully',
          'Health check endpoints respond correctly',
          'Monitoring and alerting configured',
        ],
      },
      {
        content: 'Full docs: docs/developer/deployment-review.md',
        type: 'tip',
      },
    ],
  },
];

// ============================================================================
// HELPERS
// ============================================================================

export const getDevDocBySlug = (slug: string): DevDocEntry | undefined => {
  return developerDocs.find((doc) => doc.slug === slug);
};
