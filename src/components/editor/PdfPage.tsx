import { useEffect, useRef, useState } from 'react';

import { renderPage, type PDFDocumentProxy, type PDFPageProxy } from './pdfjs';
import { SelectionOverlay } from './SelectionOverlay';

type Status = 'idle' | 'rendering' | 'rendered' | 'error';

interface PdfPageProps {
  doc: PDFDocumentProxy;
  /** 1-indexed page number, matching pdf.js convention. */
  pageNumber: number;
  /** Zoom level. 1 = native PDF points (1pt = 1/72in). */
  scale: number;
  /** Window of pages around the viewport that should hold rendered canvases. */
  isVisible: boolean;
  /**
   * Approximate height in CSS pixels used as a placeholder before the page
   * has been measured. Keeps the scroll-bar geometry stable while pages
   * resolve their real dimensions asynchronously.
   */
  estimatedHeight: number;
  /** Called once with the page's actual rendered width × height. */
  onMeasured?: (dimensions: { width: number; height: number }) => void;
  /**
   * When set, the page mounts a [SelectionOverlay]:
   *   - `'highlight'`: drag-to-rect (text-markup highlight UX).
   *   - `'sticky'`: click-to-place (sticky-note UX).
   * In either case the resulting rect (PDF user-space, ready for
   * `annotation.add`) is reported via [onSelectionRect].
   */
  selectionMode?: 'highlight' | 'sticky' | null;
  onSelectionRect?: (
    pageNumber: number,
    rect: [number, number, number, number]
  ) => void;
}

/**
 * A single PDF page that only renders when within the visible window.
 *
 * Phase 1 virtualization rule: callers (`PdfViewer`) decide via
 * `isVisible` which pages get their canvases mounted. Pages outside the
 * window keep a placeholder `<div>` of `estimatedHeight` so the scroll
 * position stays accurate.
 */
export function PdfPage({
  doc,
  pageNumber,
  scale,
  isVisible,
  estimatedHeight,
  onMeasured,
  selectionMode,
  onSelectionRect,
}: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  /**
   * The pdf.js page handle for THIS page, retained after render so the
   * selection overlay can call `viewport.convertToPdfPoint` without
   * re-fetching. Set on successful render; reset when isVisible flips.
   */
  const [pageProxy, setPageProxy] = useState<PDFPageProxy | null>(null);
  const [cssDims, setCssDims] = useState<{ width: number; height: number } | null>(
    null
  );

  useEffect(() => {
    if (!isVisible) {
      setPageProxy(null);
      setCssDims(null);
      return;
    }
    let cancelled = false;
    setStatus('rendering');

    (async () => {
      try {
        const page = await doc.getPage(pageNumber);
        if (cancelled || !canvasRef.current) return;
        const dims = await renderPage(page, canvasRef.current, scale);
        if (cancelled) return;
        setStatus('rendered');
        setPageProxy(page);
        setCssDims(dims);
        onMeasured?.(dims);
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setError(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber, scale, isVisible, onMeasured]);

  if (!isVisible) {
    return (
      <div
        data-testid={`pdf-page-placeholder-${pageNumber}`}
        style={{ height: `${estimatedHeight}px` }}
        className="bg-muted/30 flex items-center justify-center text-muted-foreground text-sm"
      >
        Page {pageNumber}
      </div>
    );
  }

  return (
    <div
      data-testid={`pdf-page-${pageNumber}`}
      className="bg-background shadow-sm border rounded-sm overflow-hidden"
      style={{ position: 'relative' }}
    >
      {status === 'error' ? (
        <div className="p-4 text-sm text-destructive">
          Page {pageNumber} failed to render: {error}
        </div>
      ) : (
        <>
          <canvas ref={canvasRef} aria-label={`PDF page ${pageNumber}`} />
          {selectionMode && pageProxy && cssDims && onSelectionRect && (
            <SelectionOverlay
              page={pageProxy}
              scale={scale}
              cssWidth={cssDims.width}
              cssHeight={cssDims.height}
              mode={selectionMode === 'sticky' ? 'point' : 'rect'}
              onSelected={(rect) => onSelectionRect(pageNumber, rect)}
            />
          )}
        </>
      )}
    </div>
  );
}
