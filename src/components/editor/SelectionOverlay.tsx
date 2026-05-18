import { useEffect, useRef, useState } from 'react';

import type { PDFPageProxy } from './pdfjs';

interface SelectionOverlayProps {
  /** The pdf.js page handle — used to access the viewport for coord conversion. */
  page: PDFPageProxy;
  /** The scale the page was rendered at; must match the canvas. */
  scale: number;
  /**
   * Width/height of the canvas in CSS pixels. We can't read this from the
   * page object (it has rendered-pixel dims that include devicePixelRatio);
   * the parent measures it after render and passes it down.
   */
  cssWidth: number;
  cssHeight: number;
  /**
   * Selection mode. Drives both the visual cursor and what counts as
   * a commit:
   *   - `'rect'`: user drags out a rectangle; sub-threshold drags are
   *     discarded. The canonical drag-to-highlight UX.
   *   - `'point'`: a single click emits a fixed-size icon rect centred
   *     on the click. Drags are also accepted; the centroid of the
   *     drag becomes the click point. The canonical sticky-note UX.
   *
   * Defaults to `'rect'` for back-compat with callers that predate
   * sticky-note mode.
   */
  mode?: 'rect' | 'point';
  /**
   * Side length in PDF points of the icon emitted in `'point'` mode.
   * Default 16pt — Acrobat's conventional sticky-icon size.
   */
  pointSizePt?: number;
  /**
   * Fires after the user finishes drawing a rectangle. `rect` is in PDF
   * user-space points (origin bottom-left), ready to feed directly into
   * `annotation.add`. In `'rect'` mode, sub-threshold drags
   * (`< minDragPx`) are skipped.
   */
  onSelected: (rect: [number, number, number, number]) => void;
  /**
   * Minimum drag distance in CSS pixels before a `'rect'`-mode
   * selection fires. Filters out accidental clicks. Default 4px.
   * Ignored in `'point'` mode.
   */
  minDragPx?: number;
}

interface DragState {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  active: boolean;
}

/**
 * A transparent overlay that captures mouse drags on top of a rendered
 * PDF page canvas and reports the drawn rectangle in PDF user-space
 * coordinates.
 *
 * Behaviour:
 *   - Pointer-events are enabled only while the overlay is mounted; the
 *     parent unmounts the overlay when selection mode is off so the
 *     normal canvas interactions (scroll, native text-select on a future
 *     pdf.js text layer) are unaffected.
 *   - Coord conversion uses pdf.js's `PageViewport.convertToPdfPoint`,
 *     which inverts the viewport→PDF transform — that correctly handles
 *     the Y-axis flip (PDF origin bottom-left vs. screen top-left) and
 *     any future scale / rotation in the viewport.
 *   - On mouseup outside the overlay (e.g. user drags off the page), the
 *     in-progress rectangle is committed using the last move position.
 */
export function SelectionOverlay({
  page,
  scale,
  cssWidth,
  cssHeight,
  mode = 'rect',
  pointSizePt = 16,
  onSelected,
  minDragPx = 4,
}: SelectionOverlayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  // Window-level mousemove/mouseup so a drag that leaves the overlay
  // still gets committed. Without this the user can release outside
  // and the rectangle hangs around forever.
  useEffect(() => {
    if (!drag?.active) return;
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setDrag((d) =>
        d
          ? {
              ...d,
              endX: clamp(e.clientX - rect.left, 0, cssWidth),
              endY: clamp(e.clientY - rect.top, 0, cssHeight),
            }
          : d
      );
    };
    const onUp = () => {
      setDrag((d) => {
        if (!d) return d;
        if (mode === 'point') {
          // Click-to-place sticky: emit a fixed-size icon rect
          // centred on the release point (or the click point if the
          // user didn't drag at all).
          commitPoint(d, page, scale, pointSizePt)
            .then(onSelected)
            .catch(() => {
              /* see commitSelection comment */
            });
        } else {
          const dx = Math.abs(d.endX - d.startX);
          const dy = Math.abs(d.endY - d.startY);
          if (dx >= minDragPx && dy >= minDragPx) {
            commitSelection(d, page, scale)
              .then(onSelected)
              .catch(() => {
                // Coord conversion can't realistically fail with
                // valid viewport inputs; swallow rather than spam
                // the console.
              });
          }
        }
        return { ...d, active: false };
      });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [
    drag?.active,
    cssWidth,
    cssHeight,
    mode,
    pointSizePt,
    minDragPx,
    page,
    scale,
    onSelected,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrag({ startX: x, startY: y, endX: x, endY: y, active: true });
  };

  // Visual marquee dimensions.
  const marquee = drag
    ? {
        left: Math.min(drag.startX, drag.endX),
        top: Math.min(drag.startY, drag.endY),
        width: Math.abs(drag.endX - drag.startX),
        height: Math.abs(drag.endY - drag.startY),
      }
    : null;

  return (
    <div
      ref={containerRef}
      data-testid="selection-overlay"
      data-mode={mode}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        inset: 0,
        // Point mode is a single-click interaction; show the "I'm a
        // click target" cursor rather than the rect-drag crosshair.
        cursor: mode === 'point' ? 'copy' : 'crosshair',
        userSelect: 'none',
      }}
    >
      {marquee && marquee.width > 0 && marquee.height > 0 && (
        <div
          data-testid="selection-marquee"
          style={{
            position: 'absolute',
            left: `${marquee.left}px`,
            top: `${marquee.top}px`,
            width: `${marquee.width}px`,
            height: `${marquee.height}px`,
            background: 'rgba(255, 235, 59, 0.25)',
            border: '1px dashed rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Convert the drag's CSS-pixel start/end corners to a PDF user-space
 * rectangle (origin bottom-left, X→right, Y→up). pdf.js's viewport
 * does the math via `convertToPdfPoint`, which inverts the
 * viewport→PDF transform — that handles the Y-axis flip, scale, and
 * any rotation baked into the viewport.
 */
/**
 * Click-to-place: emit a small icon-sized rect centred on the release
 * point. `sizePt` is the side length in PDF points (16pt by default,
 * matching Acrobat's sticky-icon size). The endpoint of the drag is
 * used as the anchor — if the user didn't drag, end == start, which
 * is the pure-click case.
 */
async function commitPoint(
  drag: DragState,
  page: PDFPageProxy,
  scale: number,
  sizePt: number
): Promise<[number, number, number, number]> {
  const viewport = page.getViewport({ scale });
  const [cx, cy] = viewport.convertToPdfPoint(drag.endX, drag.endY);
  const half = sizePt / 2;
  return [cx - half, cy - half, cx + half, cy + half];
}

async function commitSelection(
  drag: DragState,
  page: PDFPageProxy,
  scale: number
): Promise<[number, number, number, number]> {
  const viewport = page.getViewport({ scale });
  const [x0v, y0v] = viewport.convertToPdfPoint(drag.startX, drag.startY);
  const [x1v, y1v] = viewport.convertToPdfPoint(drag.endX, drag.endY);
  // The two corners may be in any order; the backend's AddAnnotation
  // normalises, but we do it here too so the wire payload is tidy.
  const x0 = Math.min(x0v, x1v);
  const x1 = Math.max(x0v, x1v);
  const y0 = Math.min(y0v, y1v);
  const y1 = Math.max(y0v, y1v);
  return [x0, y0, x1, y1];
}
