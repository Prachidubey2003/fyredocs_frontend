/**
 * @vitest-environment jsdom
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@/test/test-utils';

// Mock the pdfjs facade so we don't pull the worker into jsdom. The
// PdfViewer load path is the only one we exercise here; rendering
// canvases is the canvas-mocking rabbit hole that's not worth chasing
// for callback wiring tests.
vi.mock('../pdfjs', () => ({
  loadPdf: vi.fn(),
}));

// jsdom doesn't ship IntersectionObserver. PdfViewer constructs one
// in an effect after load; without this stub the constructor throws
// inside react-dom and the error surfaces as test noise.
beforeAll(() => {
  class StubObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin = '';
    readonly thresholds: ReadonlyArray<number> = [];
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  // @ts-expect-error global stub
  globalThis.IntersectionObserver = StubObserver;
});

import { loadPdf } from '../pdfjs';
import { PdfViewer } from '../PdfViewer';

const mockLoadPdf = loadPdf as unknown as ReturnType<typeof vi.fn>;

/** Build a fake `PDFDocumentProxy` good enough for the load path. */
function fakeDoc(numPages: number) {
  return {
    numPages,
    destroy: vi.fn(),
    getPage: vi.fn(),
  };
}

describe('PdfViewer callback wiring', () => {
  it('fires onPageCountChange with numPages after load', async () => {
    mockLoadPdf.mockReset();
    mockLoadPdf.mockResolvedValueOnce(fakeDoc(7));
    const onPageCountChange = vi.fn();
    render(
      <PdfViewer
        src="stub://test.pdf"
        onPageCountChange={onPageCountChange}
      />
    );
    await waitFor(() => expect(onPageCountChange).toHaveBeenCalledWith(7));
  });

  it('fires onCurrentPageChange(1) after load (initial state)', async () => {
    mockLoadPdf.mockReset();
    mockLoadPdf.mockResolvedValueOnce(fakeDoc(3));
    const onCurrentPageChange = vi.fn();
    render(
      <PdfViewer
        src="stub://test.pdf"
        onCurrentPageChange={onCurrentPageChange}
      />
    );
    await waitFor(() =>
      expect(onCurrentPageChange).toHaveBeenCalledWith(1)
    );
  });

  it('does not fire either callback when src is null', () => {
    mockLoadPdf.mockReset();
    const onPageCountChange = vi.fn();
    const onCurrentPageChange = vi.fn();
    render(
      <PdfViewer
        src={null}
        onPageCountChange={onPageCountChange}
        onCurrentPageChange={onCurrentPageChange}
      />
    );
    expect(onPageCountChange).not.toHaveBeenCalled();
    expect(onCurrentPageChange).not.toHaveBeenCalled();
    expect(mockLoadPdf).not.toHaveBeenCalled();
  });

  it('scrolls the requested page into view when goToPage changes', async () => {
    mockLoadPdf.mockReset();
    mockLoadPdf.mockResolvedValueOnce(fakeDoc(5));
    // jsdom doesn't implement scrollIntoView; stub it on the
    // Element prototype so the viewer's effect can call it without
    // throwing, and we can assert on the call.
    const scrollSpy = vi.fn();
    const originalScroll = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollSpy;
    try {
      const { rerender } = render(
        <PdfViewer
          src="stub://test.pdf"
          goToPage={{ page: 1, nonce: 0 }}
        />
      );
      // Wait for load so the page-refs map is populated.
      await waitFor(() => expect(mockLoadPdf).toHaveBeenCalled());

      // Re-render with a new goToPage request. The effect should
      // pick up the change and call scrollIntoView on page 4's ref.
      rerender(
        <PdfViewer
          src="stub://test.pdf"
          goToPage={{ page: 4, nonce: 1 }}
        />
      );
      await waitFor(() => expect(scrollSpy).toHaveBeenCalled());
    } finally {
      Element.prototype.scrollIntoView = originalScroll;
    }
  });

  it('ignores goToPage values outside [1, numPages]', async () => {
    mockLoadPdf.mockReset();
    mockLoadPdf.mockResolvedValueOnce(fakeDoc(3));
    const scrollSpy = vi.fn();
    const originalScroll = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollSpy;
    try {
      render(
        <PdfViewer
          src="stub://test.pdf"
          // Out of range — should not trigger a scroll.
          goToPage={{ page: 99, nonce: 0 }}
        />
      );
      await waitFor(() => expect(mockLoadPdf).toHaveBeenCalled());
      // Give the effect a tick to run.
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(scrollSpy).not.toHaveBeenCalled();
    } finally {
      Element.prototype.scrollIntoView = originalScroll;
    }
  });

  it('does not call onPageCountChange when load fails', async () => {
    mockLoadPdf.mockReset();
    mockLoadPdf.mockRejectedValueOnce(new Error('bad PDF'));
    const onPageCountChange = vi.fn();
    render(
      <PdfViewer
        src="stub://broken.pdf"
        onPageCountChange={onPageCountChange}
      />
    );
    // Give the rejection a chance to settle. The viewer renders an
    // error message; the callback must NOT have fired.
    await waitFor(() => {
      const text = document.body.textContent ?? '';
      expect(text).toMatch(/Failed to load PDF/);
    });
    expect(onPageCountChange).not.toHaveBeenCalled();
  });
});
