import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { loadPdf, type PdfSource, type PDFDocumentProxy } from './pdfjs';
import { PdfPage } from './PdfPage';

interface PdfViewerProps {
  /** Source — URL, ArrayBuffer, Blob, or File. Re-loads when this changes. */
  src: PdfSource | null;
  /** Initial zoom; user-driven zoom controls land in the next iteration. */
  scale?: number;
  /**
   * How many pages above/below the viewport to keep rendered. Higher = smoother
   * scrolling, more memory. Default 1 (just enough to avoid blank flashes).
   */
  overscan?: number;
  className?: string;
  /**
   * When set, each visible page gets a [SelectionOverlay] that lets the
   * user draw a rectangle. The drawn rect (in PDF user-space points,
   * origin bottom-left) is reported via [onSelectionRect].
   */
  selectionMode?: 'highlight' | 'sticky' | null;
  onSelectionRect?: (
    pageNumber: number,
    rect: [number, number, number, number]
  ) => void;
  /**
   * Fires when the topmost-visible page changes — i.e. when the user
   * scrolls between pages. The parent uses this to drive the
   * "current page" notion that the toolbar acts on. Also fires once
   * with `1` shortly after the document loads.
   */
  onCurrentPageChange?: (pageNumber: number) => void;
  /** Fires once after load with the document's total page count. */
  onPageCountChange?: (pageCount: number) => void;
  /**
   * Imperative scroll trigger. Set to a 1-indexed page number to
   * scroll that page into view; change the value (or set to the same
   * page after wrapping it in an object via `[goToPage, nonce]`) to
   * re-trigger. We use a `{ page, nonce }` shape so that requesting
   * the same page twice still scrolls — useful when the user clicks
   * "go to page N" twice after manually scrolling away.
   */
  goToPage?: { page: number; nonce: number } | null;
}

const DEFAULT_PAGE_HEIGHT_PX = 1056; // 8.5" × 11" letter-paper @ scale=1, dpr=1

/**
 * Viewport-virtualized PDF viewer. Renders only the pages near the user's
 * scroll position; everything else is a placeholder of the right height so
 * the scroll-bar geometry stays correct.
 *
 * Rendering engine is pdf.js today (BSD, mature, Vite-friendly). The plan
 * (§5.3) calls for migrating to PDFium-WASM for server/client pixel-parity;
 * that swap is isolated to `./pdfjs.ts` — no changes here.
 */
export function PdfViewer({
  src,
  scale = 1,
  overscan = 1,
  className,
  selectionMode,
  onSelectionRect,
  onCurrentPageChange,
  onPageCountChange,
  goToPage,
}: PdfViewerProps) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [visibleRange, setVisibleRange] = useState<{
    start: number;
    end: number;
  }>({ start: 1, end: 1 });
  /** Per-page measured heights (1-indexed via `pageHeights[n-1]`). */
  const [pageHeights, setPageHeights] = useState<Record<number, number>>({});

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // ---- Load ----
  useEffect(() => {
    if (!src) {
      setDoc(null);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    let loaded: PDFDocumentProxy | null = null;
    setLoadError(null);
    loadPdf(src)
      .then((d) => {
        if (cancelled) {
          d.destroy();
          return;
        }
        loaded = d;
        setDoc(d);
        setVisibleRange({ start: 1, end: Math.min(d.numPages, 3) });
        onPageCountChange?.(d.numPages);
        onCurrentPageChange?.(1);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
      if (loaded) loaded.destroy();
    };
  }, [src]);

  // ---- Virtualization ----
  // IntersectionObserver tracks which placeholder/canvas containers are near
  // the viewport. We then derive the contiguous visible range from those
  // observations and ask only that range's pages to render.
  useEffect(() => {
    if (!doc || !scrollRef.current) return;
    const visible = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const pageNum = Number(
            (entry.target as HTMLElement).dataset.pageNumber
          );
          if (!Number.isFinite(pageNum)) continue;
          if (entry.isIntersecting) {
            visible.add(pageNum);
          } else {
            visible.delete(pageNum);
          }
        }
        if (visible.size === 0) return;
        const min = Math.min(...visible);
        const max = Math.max(...visible);
        setVisibleRange({
          start: Math.max(1, min - overscan),
          end: Math.min(doc.numPages, max + overscan),
        });
        // The topmost-visible page is the user's "current" page for
        // toolbar purposes. Fire whenever the top of the visible
        // range changes; React handles dedupe via prop identity.
        onCurrentPageChange?.(min);
      },
      {
        root: scrollRef.current,
        // Trigger early so off-screen pages start rendering before they
        // scroll in. 200px is roughly one mouse-wheel notch.
        rootMargin: '200px 0px',
        threshold: 0,
      }
    );
    for (const el of pageRefs.current.values()) {
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, [doc, overscan]);

  // ---- Scroll-to-page ----
  // Imperative jump: when `goToPage.nonce` changes we look up the
  // matching page ref and scroll it into view. We rely on the page
  // refs being registered (which they are, immediately on mount,
  // because we always render either a real PdfPage or a placeholder
  // for every page in `pages`).
  useEffect(() => {
    if (!doc || !goToPage) return;
    const { page } = goToPage;
    if (!Number.isFinite(page) || page < 1 || page > doc.numPages) return;
    const el = pageRefs.current.get(page);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [doc, goToPage]);

  const setPageRef = useCallback(
    (pageNumber: number) => (el: HTMLDivElement | null) => {
      if (el) {
        el.dataset.pageNumber = String(pageNumber);
        pageRefs.current.set(pageNumber, el);
      } else {
        pageRefs.current.delete(pageNumber);
      }
    },
    []
  );

  const onMeasured = useCallback(
    (pageNumber: number) =>
      ({ height }: { width: number; height: number }) => {
        setPageHeights((prev) =>
          prev[pageNumber] === height ? prev : { ...prev, [pageNumber]: height }
        );
      },
    []
  );

  const pages = useMemo(() => {
    if (!doc) return [];
    return Array.from({ length: doc.numPages }, (_, i) => i + 1);
  }, [doc]);

  if (loadError) {
    return (
      <div
        role="alert"
        className={`p-6 border border-destructive/40 rounded-md bg-destructive/5 text-destructive ${className ?? ''}`}
      >
        Failed to load PDF: {loadError}
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={`p-6 text-center text-muted-foreground border border-dashed rounded-md ${className ?? ''}`}
      >
        No PDF loaded.
      </div>
    );
  }

  if (!doc) {
    return (
      <div
        className={`p-6 text-center text-muted-foreground ${className ?? ''}`}
        aria-busy="true"
      >
        Loading PDF…
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      data-testid="pdf-viewer"
      data-page-count={doc.numPages}
      className={`overflow-auto h-full bg-muted/20 ${className ?? ''}`}
    >
      <div className="flex flex-col items-center gap-4 p-4">
        {pages.map((pageNumber) => {
          const isVisible =
            pageNumber >= visibleRange.start && pageNumber <= visibleRange.end;
          return (
            <div key={pageNumber} ref={setPageRef(pageNumber)}>
              <PdfPage
                doc={doc}
                pageNumber={pageNumber}
                scale={scale}
                isVisible={isVisible}
                estimatedHeight={
                  pageHeights[pageNumber] ?? DEFAULT_PAGE_HEIGHT_PX
                }
                onMeasured={onMeasured(pageNumber)}
                selectionMode={selectionMode}
                onSelectionRect={onSelectionRect}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
