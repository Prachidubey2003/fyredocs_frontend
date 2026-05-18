import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@/test/test-utils';

import { SelectionOverlay } from '../SelectionOverlay';
import type { PDFPageProxy } from '../pdfjs';

/**
 * Stub the pdf.js page just enough for the overlay's coord-conversion
 * path. Real `PageViewport.convertToPdfPoint(x, y)` inverts the
 * viewport→PDF transform; for letter paper at scale=1, viewport
 * height ≈ 792 and the Y-flip is `pdfY = viewportH - y`.
 */
function stubPage(viewportH: number): PDFPageProxy {
  return {
    getViewport: () => ({
      width: 612,
      height: viewportH,
      // Inverse of the PDF→viewport transform: at scale=1 with no
      // rotation, PDF X == viewport X, PDF Y == viewportH - viewport Y.
      convertToPdfPoint: (x: number, y: number) => [x, viewportH - y],
    }),
  } as unknown as PDFPageProxy;
}

describe('SelectionOverlay', () => {
  /**
   * jsdom doesn't lay out elements, so getBoundingClientRect on the
   * overlay returns zeros. We patch the prototype to return a known
   * 612×792 rect so the mouse-coord math in the component matches a
   * realistic page render.
   */
  function patchBoundingRect() {
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      return {
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: 612,
        bottom: 792,
        width: 612,
        height: 792,
        toJSON: () => ({}),
      } as DOMRect;
    };
    return () => {
      Element.prototype.getBoundingClientRect = original;
    };
  }

  it('renders the overlay container', () => {
    const restore = patchBoundingRect();
    render(
      <SelectionOverlay
        page={stubPage(792)}
        scale={1}
        cssWidth={612}
        cssHeight={792}
        onSelected={vi.fn()}
      />
    );
    expect(screen.getByTestId('selection-overlay')).toBeInTheDocument();
    restore();
  });

  it('does not render the marquee before a drag starts', () => {
    const restore = patchBoundingRect();
    render(
      <SelectionOverlay
        page={stubPage(792)}
        scale={1}
        cssWidth={612}
        cssHeight={792}
        onSelected={vi.fn()}
      />
    );
    expect(screen.queryByTestId('selection-marquee')).toBeNull();
    restore();
  });

  it('fires onSelected with PDF-space coords on mouseup (Y-flipped)', async () => {
    const restore = patchBoundingRect();
    const onSelected = vi.fn();
    render(
      <SelectionOverlay
        page={stubPage(792)}
        scale={1}
        cssWidth={612}
        cssHeight={792}
        onSelected={onSelected}
      />
    );
    const overlay = screen.getByTestId('selection-overlay');
    // Mouse down at (100, 100) in CSS pixels → PDF (100, 692).
    fireEvent.mouseDown(overlay, { clientX: 100, clientY: 100 });
    // Window-level mousemove to (200, 200) → PDF (200, 592).
    fireEvent.mouseMove(window, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(window);

    await waitFor(() => expect(onSelected).toHaveBeenCalledTimes(1));
    const rect = onSelected.mock.calls[0][0] as [number, number, number, number];
    expect(rect[0]).toBe(100); // x0
    expect(rect[2]).toBe(200); // x1
    // Y is flipped: the screen-Y=100 corner becomes pdfY=692 (the
    // larger value), and screen-Y=200 → pdfY=592 (smaller). After the
    // overlay's min/max normalisation, y0=592, y1=692.
    expect(rect[1]).toBe(592);
    expect(rect[3]).toBe(692);
    restore();
  });

  it('skips onSelected for sub-threshold drags (just a click)', () => {
    const restore = patchBoundingRect();
    const onSelected = vi.fn();
    render(
      <SelectionOverlay
        page={stubPage(792)}
        scale={1}
        cssWidth={612}
        cssHeight={792}
        onSelected={onSelected}
        minDragPx={4}
      />
    );
    const overlay = screen.getByTestId('selection-overlay');
    fireEvent.mouseDown(overlay, { clientX: 100, clientY: 100 });
    // 1px drag — below threshold.
    fireEvent.mouseMove(window, { clientX: 101, clientY: 101 });
    fireEvent.mouseUp(window);
    expect(onSelected).not.toHaveBeenCalled();
    restore();
  });

  it('clamps drag end position to overlay bounds', async () => {
    const restore = patchBoundingRect();
    const onSelected = vi.fn();
    render(
      <SelectionOverlay
        page={stubPage(792)}
        scale={1}
        cssWidth={612}
        cssHeight={792}
        onSelected={onSelected}
      />
    );
    const overlay = screen.getByTestId('selection-overlay');
    fireEvent.mouseDown(overlay, { clientX: 100, clientY: 100 });
    // Drag well past the right and bottom edges.
    fireEvent.mouseMove(window, { clientX: 9999, clientY: 9999 });
    fireEvent.mouseUp(window);
    await waitFor(() => expect(onSelected).toHaveBeenCalled());
    const rect = onSelected.mock.calls[0][0] as [number, number, number, number];
    // Clamped to cssWidth=612, cssHeight=792 → PDF x1=612, y0=0.
    expect(rect[2]).toBe(612);
    expect(rect[1]).toBe(0);
    restore();
  });

  it('point mode emits a fixed-size rect on a pure click (no drag)', async () => {
    const restore = patchBoundingRect();
    const onSelected = vi.fn();
    render(
      <SelectionOverlay
        page={stubPage(792)}
        scale={1}
        cssWidth={612}
        cssHeight={792}
        mode="point"
        pointSizePt={16}
        onSelected={onSelected}
      />
    );
    const overlay = screen.getByTestId('selection-overlay');
    expect(overlay.getAttribute('data-mode')).toBe('point');

    // Pure click at (100, 200). Even without a mousemove, point mode
    // should commit on mouseup. PDF Y at click → 792 - 200 = 592.
    // Rect is 16pt around the centre: [92, 584, 108, 600].
    fireEvent.mouseDown(overlay, { clientX: 100, clientY: 200 });
    fireEvent.mouseUp(window);

    await waitFor(() => expect(onSelected).toHaveBeenCalledTimes(1));
    const rect = onSelected.mock.calls[0][0] as [number, number, number, number];
    expect(rect[0]).toBe(92);
    expect(rect[1]).toBe(584);
    expect(rect[2]).toBe(108);
    expect(rect[3]).toBe(600);
    restore();
  });

  it('point mode does not draw a marquee', () => {
    const restore = patchBoundingRect();
    render(
      <SelectionOverlay
        page={stubPage(792)}
        scale={1}
        cssWidth={612}
        cssHeight={792}
        mode="point"
        onSelected={vi.fn()}
      />
    );
    const overlay = screen.getByTestId('selection-overlay');
    fireEvent.mouseDown(overlay, { clientX: 100, clientY: 100 });
    // No mousemove → no marquee. (Point mode doesn't suppress the
    // marquee outright but a zero-area marquee is filtered out by
    // the existing `marquee.width > 0` guard.)
    expect(screen.queryByTestId('selection-marquee')).toBeNull();
    fireEvent.mouseUp(window);
    restore();
  });

  it('shows the marquee element during a drag', () => {
    const restore = patchBoundingRect();
    render(
      <SelectionOverlay
        page={stubPage(792)}
        scale={1}
        cssWidth={612}
        cssHeight={792}
        onSelected={vi.fn()}
      />
    );
    const overlay = screen.getByTestId('selection-overlay');
    fireEvent.mouseDown(overlay, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(window, { clientX: 150, clientY: 150 });
    expect(screen.getByTestId('selection-marquee')).toBeInTheDocument();
    fireEvent.mouseUp(window);
    restore();
  });
});
