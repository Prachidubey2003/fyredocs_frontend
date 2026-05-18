import { useState } from 'react';

import { applyOps, downloadDocumentUrl } from '@/lib/editorApi';

interface EditorToolbarProps {
  /** Document id; null disables every action (toolbar still renders). */
  documentId: string | null;
  /**
   * 1-indexed page the toolbar should act on. Today the parent passes
   * the page nearest the scroll viewport; in a richer UX this becomes
   * the selected page or selection rect.
   */
  currentPage: number;
  /**
   * Called after a successful edit so the parent can re-fetch the PDF
   * bytes and re-render. The new revision id is passed for debugging
   * and (eventually) for optimistic-history UX.
   */
  onAfterEdit: (newRevisionId: string) => void;
  /**
   * Current selection mode:
   *   - `'highlight'`: marquee-overlay drag-to-highlight UX.
   *   - `'sticky'`: click-to-place sticky-note UX.
   *   - `null`: no mode active (normal scroll/zoom).
   * The two modes are mutually exclusive — activating one disables
   * the other.
   */
  selectionMode: 'highlight' | 'sticky' | null;
  /** Sets the selection mode (or `null` to exit). */
  onSelectionModeChange: (mode: 'highlight' | 'sticky' | null) => void;
  /** Current zoom level (1.0 = 100%). */
  zoom: number;
  /** Sets the zoom; the parent clamps to known levels. */
  onZoomChange: (zoom: number) => void;
}

/**
 * Preset zoom levels users cycle through with `+` / `−`. Familiar
 * stepping pattern from Acrobat / Preview — every step is either
 * 1.25× or 1.33×, which gives a visible-but-not-jarring change.
 */
export const ZOOM_LEVELS: readonly number[] = [
  0.5, 0.75, 1.0, 1.25, 1.5, 2.0,
];

/** Snap an arbitrary zoom to the nearest preset, used when the parent
 *  initialises from a saved value that may not match the table. */
export function nearestZoomLevel(z: number): number {
  let best = ZOOM_LEVELS[0];
  let bestDelta = Math.abs(z - best);
  for (const level of ZOOM_LEVELS) {
    const d = Math.abs(z - level);
    if (d < bestDelta) {
      best = level;
      bestDelta = d;
    }
  }
  return best;
}

/**
 * Minimal editor toolbar that drives the v0 sPDOM op set.
 *
 * Buttons:
 *   - Rotate current page (90° CW per click; wraps 0 → 90 → 180 → 270 → 0).
 *   - Highlight a fixed-position test rect (real selection-driven UX
 *     lands once the canvas overlay supports rect selection).
 *   - Download the current revision (browser-native save dialog).
 *
 * The fixed test-rect highlight is intentionally crude — its purpose
 * is to exercise the round-trip from a click through the /edit API
 * end to end. The selection-aware highlight UX is a tracked follow-up.
 */
export function EditorToolbar({
  documentId,
  currentPage,
  onAfterEdit,
  selectionMode,
  onSelectionModeChange,
  zoom,
  onZoomChange,
}: EditorToolbarProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Per-page rotation in the editor's local view of the world. We
   *  don't fetch /spdom to learn the truth between calls — we just
   *  bump our local tally and send it as the absolute new rotation. */
  const [localRotation, setLocalRotation] = useState<Record<number, number>>(
    {}
  );

  const disabled = !documentId || busy;

  const runOp = async (label: string, work: () => Promise<string>) => {
    setError(null);
    setBusy(true);
    try {
      const revId = await work();
      onAfterEdit(revId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`${label}: ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  const handleRotate = () => {
    if (!documentId) return;
    const prev = localRotation[currentPage] ?? 0;
    const next = ((prev + 90) % 360) as 0 | 90 | 180 | 270;
    void runOp('rotate', async () => {
      const rev = await applyOps(documentId, [
        { type: 'page.rotate', page: currentPage, rotation: next },
      ]);
      setLocalRotation((r) => ({ ...r, [currentPage]: next }));
      return rev.id;
    });
  };

  const toggleHighlightMode = () => {
    onSelectionModeChange(selectionMode === 'highlight' ? null : 'highlight');
  };

  const toggleStickyMode = () => {
    onSelectionModeChange(selectionMode === 'sticky' ? null : 'sticky');
  };

  /** Step zoom up/down through ZOOM_LEVELS. Clamps at the table edges. */
  const stepZoom = (direction: 1 | -1) => {
    const current = nearestZoomLevel(zoom);
    const idx = ZOOM_LEVELS.indexOf(current);
    const next = idx + direction;
    if (next < 0 || next >= ZOOM_LEVELS.length) return;
    onZoomChange(ZOOM_LEVELS[next]);
  };

  const zoomIn = () => stepZoom(1);
  const zoomOut = () => stepZoom(-1);
  const resetZoom = () => onZoomChange(1.0);

  const zoomPercent = Math.round(zoom * 100);
  const atMinZoom = nearestZoomLevel(zoom) === ZOOM_LEVELS[0];
  const atMaxZoom =
    nearestZoomLevel(zoom) === ZOOM_LEVELS[ZOOM_LEVELS.length - 1];

  const handleInsertAfter = () => {
    if (!documentId) return;
    void runOp('insert', async () => {
      const rev = await applyOps(documentId, [
        { type: 'page.insert', afterPage: currentPage },
      ]);
      return rev.id;
    });
  };

  const handleDelete = () => {
    if (!documentId) return;
    // Native confirm dialog — destructive op, and we have no undo UI
    // yet. The backend refuses if it would delete the last page, but
    // a client-side confirmation prevents accidental clicks too.
    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Delete page ${currentPage}? This can't be undone in v0.`)
    ) {
      return;
    }
    void runOp('delete', async () => {
      const rev = await applyOps(documentId, [
        { type: 'page.delete', page: currentPage },
      ]);
      return rev.id;
    });
  };

  const downloadHref = documentId ? downloadDocumentUrl(documentId) : undefined;

  return (
    <div
      data-testid="editor-toolbar"
      className="flex flex-wrap items-center gap-2 px-3 py-2 bg-card border rounded-md text-sm"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={handleRotate}
        className="px-3 py-1.5 rounded border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`Rotate page ${currentPage} 90 degrees clockwise`}
      >
        Rotate page {currentPage}
      </button>
      <button
        type="button"
        disabled={!documentId || busy}
        onClick={toggleHighlightMode}
        aria-pressed={selectionMode === 'highlight'}
        className={`px-3 py-1.5 rounded border disabled:opacity-50 disabled:cursor-not-allowed ${
          selectionMode === 'highlight'
            ? 'bg-yellow-200 border-yellow-500 hover:bg-yellow-300'
            : 'hover:bg-muted'
        }`}
        aria-label={
          selectionMode === 'highlight'
            ? 'Exit highlight mode'
            : 'Enter highlight mode (drag a rectangle on a page)'
        }
      >
        {selectionMode === 'highlight' ? 'Highlight: on' : 'Highlight'}
      </button>
      <button
        type="button"
        disabled={!documentId || busy}
        onClick={toggleStickyMode}
        aria-pressed={selectionMode === 'sticky'}
        className={`px-3 py-1.5 rounded border disabled:opacity-50 disabled:cursor-not-allowed ${
          selectionMode === 'sticky'
            ? 'bg-amber-200 border-amber-500 hover:bg-amber-300'
            : 'hover:bg-muted'
        }`}
        aria-label={
          selectionMode === 'sticky'
            ? 'Exit sticky-note mode'
            : 'Enter sticky-note mode (click a page to place a note)'
        }
      >
        {selectionMode === 'sticky' ? 'Sticky: on' : 'Sticky'}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={handleInsertAfter}
        className="px-3 py-1.5 rounded border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`Insert a blank page after page ${currentPage}`}
      >
        Insert blank after {currentPage}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={handleDelete}
        className="px-3 py-1.5 rounded border border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`Delete page ${currentPage}`}
      >
        Delete page {currentPage}
      </button>
      <div
        className="flex items-center gap-1"
        data-testid="zoom-controls"
        role="group"
        aria-label="Zoom"
      >
        <button
          type="button"
          onClick={zoomOut}
          disabled={atMinZoom}
          className="px-2 py-1 rounded border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Zoom out"
        >
          &minus;
        </button>
        <button
          type="button"
          onClick={resetZoom}
          className="px-2 py-1 rounded border hover:bg-muted font-mono text-xs min-w-[3.5rem]"
          aria-label={`Reset zoom (currently ${zoomPercent}%)`}
          data-testid="zoom-percent"
        >
          {zoomPercent}%
        </button>
        <button
          type="button"
          onClick={zoomIn}
          disabled={atMaxZoom}
          className="px-2 py-1 rounded border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
      <div className="flex-1" />
      {downloadHref ? (
        <a
          href={downloadHref}
          download
          className="px-3 py-1.5 rounded border hover:bg-muted text-foreground no-underline"
        >
          Download
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="px-3 py-1.5 rounded border opacity-50 cursor-not-allowed"
        >
          Download
        </button>
      )}
      {busy && (
        <span
          aria-live="polite"
          className="text-muted-foreground"
          data-testid="editor-toolbar-busy"
        >
          working…
        </span>
      )}
      {error && (
        <span
          role="alert"
          className="text-destructive"
          data-testid="editor-toolbar-error"
        >
          {error}
        </span>
      )}
    </div>
  );
}
