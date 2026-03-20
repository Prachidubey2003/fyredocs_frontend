import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { PageSpecificationTool } from '../PageSpecificationTool';

vi.mock('@/hooks/useFileUpload', () => ({
  useFileUpload: () => ({
    files: [],
    addFiles: vi.fn(),
    removeFile: vi.fn(),
    clearFiles: vi.fn(),
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

describe('PageSpecificationTool', () => {
  it('renders remove-pages tool with correct label', () => {
    render(
      <PageSpecificationTool
        toolId="remove-pages"
        actionLabel="Remove Pages"
        actionVerb="Remove"
        description="Enter the pages you want to remove"
      />
    );
    expect(screen.getByText(/Remove Pages/i)).toBeInTheDocument();
  });

  it('renders extract-pages tool with correct label', () => {
    render(
      <PageSpecificationTool
        toolId="extract-pages"
        actionLabel="Extract Pages"
        actionVerb="Extract"
        description="Enter the pages you want to extract"
      />
    );
    expect(screen.getByText(/Extract Pages/i)).toBeInTheDocument();
  });
});
