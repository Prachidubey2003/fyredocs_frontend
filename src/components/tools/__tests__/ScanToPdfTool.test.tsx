import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { ScanToPdfTool } from '../ScanToPdfTool';

vi.mock('@/hooks/useFileUpload', () => ({
  useFileUpload: () => ({
    files: [],
    addFiles: vi.fn(),
    removeFile: vi.fn(),
    clearFiles: vi.fn(),
    reorderFiles: vi.fn(),
    isUploading: false,
    canProceed: false,
    pauseUpload: vi.fn(),
    resumeUpload: vi.fn(),
    retryUpload: vi.fn(),
  }),
}));

vi.mock('@/hooks/useJob', () => ({
  useJob: () => ({
    job: null,
    createJob: vi.fn(),
    cancelJob: vi.fn(),
    retryJob: vi.fn(),
    resetJob: vi.fn(),
    isPolling: false,
  }),
  normalizeOptions: vi.fn(),
}));

describe('ScanToPdfTool', () => {
  it('renders with correct title', () => {
    render(<ScanToPdfTool />);
    expect(screen.getByText(/Scan to PDF/i)).toBeInTheDocument();
  });

  it('shows dropzone when no files are uploaded', () => {
    render(<ScanToPdfTool />);
    const elements = screen.getAllByText(/Convert scanned images to PDF/i);
    expect(elements.length).toBeGreaterThan(0);
  });
});
