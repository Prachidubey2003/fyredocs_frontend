import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { ConvertTool } from '../ConvertTool';

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

describe('ConvertTool', () => {
  it('renders pdf-to-word tool', () => {
    render(<ConvertTool toolId="pdf-to-word" outputFormat="docx" />);
    expect(
      screen.getByRole('heading', { name: /PDF to Word/i })
    ).toBeInTheDocument();
  });

  it('renders pdf-to-ppt tool', () => {
    render(<ConvertTool toolId="pdf-to-ppt" outputFormat="pptx" />);
    expect(
      screen.getByRole('heading', { name: /PDF to PowerPoint/i })
    ).toBeInTheDocument();
  });

  it('renders pdf-to-html tool', () => {
    render(<ConvertTool toolId="pdf-to-html" outputFormat="html" />);
    expect(
      screen.getByRole('heading', { name: /PDF to HTML/i })
    ).toBeInTheDocument();
  });

  it('renders powerpoint-to-pdf tool', () => {
    render(<ConvertTool toolId="powerpoint-to-pdf" outputFormat="pdf" />);
    expect(
      screen.getByRole('heading', { name: /PowerPoint to PDF/i })
    ).toBeInTheDocument();
  });

  it('renders html-to-pdf tool', () => {
    render(<ConvertTool toolId="html-to-pdf" outputFormat="pdf" />);
    expect(
      screen.getByRole('heading', { name: /HTML to PDF/i })
    ).toBeInTheDocument();
  });

  it('renders pdf-to-pdfa tool', () => {
    render(<ConvertTool toolId="pdf-to-pdfa" outputFormat="pdf" />);
    expect(
      screen.getByRole('heading', { name: /PDF to PDF\/A/i })
    ).toBeInTheDocument();
  });
});
