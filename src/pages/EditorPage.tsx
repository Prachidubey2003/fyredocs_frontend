import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { CommentsList } from '@/components/editor/CommentsList';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { PdfViewer } from '@/components/editor/PdfViewer';
import { RevisionsList } from '@/components/editor/RevisionsList';
import {
  postEmbedMessage,
  useDebouncedEmbedSave,
  useEmbedMode,
} from '@/hooks/useEmbedMode';
import {
  applyOps,
  fetchDocumentBytes,
  getDocument,
} from '@/lib/editorApi';

/**
 * Editor page. Two modes:
 *
 *   1. **Document mode** (`?doc=<uuid>`): pulls the latest bytes from
 *      `/api/editor/v1/documents/:id/download` and renders them. The
 *      toolbar's edit buttons (rotate, highlight) call
 *      `/api/editor/v1/documents/:id/edit` and re-fetch on success so
 *      the change shows up in-place.
 *
 *   2. **Local-file mode** (no `doc` query param): drag-drop / file
 *      picker → render. The toolbar's edit buttons are disabled
 *      because there's nothing on the server to mutate. This is the
 *      existing Phase 1 demo flow, kept so people can preview PDFs
 *      without an account.
 *
 * The `?doc=` param is the deep-link contract — bookmark a document
 * URL and the editor opens to that document on next visit. We do not
 * yet auto-redirect to sign-in if unauthenticated; the API call will
 * surface the 401 via the global handler.
 */
export default function EditorPage() {
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('doc');
  const isEmbed = useEmbedMode();
  /** Tracks whether we've already dispatched `ready` for this
   *  mount. The dispatcher fires exactly once per
   *  EditorPage lifecycle so partner code can `addEventListener`
   *  for `fyredocs:ready` without expecting duplicates. */
  const readyDispatched = useRef(false);

  const [file, setFile] = useState<File | null>(null);
  const [docBytes, setDocBytes] = useState<ArrayBuffer | null>(null);
  /** Bumped after every edit to force the viewer to re-load. */
  const [revisionKey, setRevisionKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  /**
   * Selection mode. `'highlight'` enables drag-to-rect (text-markup);
   * `'sticky'` enables click-to-place sticky notes. Mutually
   * exclusive — the toolbar enforces this by routing every change
   * through the same setter.
   */
  const [selectionMode, setSelectionMode] = useState<
    'highlight' | 'sticky' | null
  >(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  /**
   * The page the toolbar acts on — driven by which page is at the top
   * of the viewer's scroll position. Defaults to 1 until the viewer
   * reports the first change after load.
   */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState<number | null>(null);
  /**
   * Imperative scroll request for the viewer. Bump `nonce` to
   * re-trigger a scroll to the same page (useful when the user types
   * the same number twice after manually scrolling elsewhere).
   */
  const [goToPage, setGoToPage] = useState<{ page: number; nonce: number } | null>(
    null
  );
  /** Bound to the page-jumper input; commits to `goToPage` on submit. */
  const [pageInput, setPageInput] = useState('1');
  /** Viewer zoom level (1.0 = 100%). The toolbar steps through presets. */
  const [zoom, setZoom] = useState(1.0);
  /**
   * The document's current revision id, used by the comments panel
   * to anchor new comments. Re-fetched alongside the document bytes
   * after every edit so it stays in sync.
   */
  const [currentRevId, setCurrentRevId] = useState<string | null>(null);

  const reloadDocument = useCallback(async () => {
    if (!documentId) return;
    setLoadError(null);
    try {
      // Fetch metadata + bytes in parallel — they're independent and
      // we want both for the viewer (bytes) and the comments panel
      // (currentRevId).
      const [doc, buf] = await Promise.all([
        getDocument(documentId),
        fetchDocumentBytes(documentId),
      ]);
      setDocBytes(buf);
      setCurrentRevId(doc.currentRevId ?? null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    }
  }, [documentId]);

  useEffect(() => {
    if (documentId) {
      void reloadDocument();
    } else {
      setDocBytes(null);
      setCurrentRevId(null);
    }
  }, [documentId, revisionKey, reloadDocument]);

  const onAfterEdit = useCallback(() => {
    setRevisionKey((k) => k + 1);
  }, []);

  // ---- Embed-mode lifecycle dispatchers -------------------------------------
  // These run only when `?embed=1` is in the URL — they bridge
  // the editor's state to the host page via `window.parent.postMessage`,
  // which @fyredocs/embed re-dispatches as `fyredocs:*`
  // CustomEvents on the <fyredocs-editor> host element.
  //
  // Event taxonomy (must stay aligned with sdks/embed/src/types.ts):
  //   - `ready`: fired once after first successful document load.
  //   - `edit`:  fired each time currentRevId changes (i.e., a new
  //              revision landed). Skipped on the initial null →
  //              first-value transition (that's `ready`'s domain).
  //   - `save`:  debounced "burst settled" signal — fires once
  //              SAVE_DEBOUNCE_MS after the last edit so hosts can
  //              show a "Saved" toast / refresh their cache without
  //              one event per toolbar click.
  //   - `error`: fired when loadError transitions from null to set.

  useEffect(() => {
    if (!isEmbed) return;
    if (readyDispatched.current) return;
    if (docBytes && currentRevId !== null) {
      postEmbedMessage({ type: 'ready' });
      readyDispatched.current = true;
    }
  }, [isEmbed, docBytes, currentRevId]);

  useEffect(() => {
    if (!isEmbed) return;
    // Only dispatch after `ready` — `edit` semantically means
    // "the document changed after the user saw it for the first
    // time", so the initial load doesn't count.
    if (!readyDispatched.current) return;
    if (currentRevId) {
      postEmbedMessage({ type: 'edit', payload: { revId: currentRevId } });
    }
  }, [isEmbed, currentRevId]);

  // `save` is the debounced peer of `edit`: hosts that want a
  // single "settled" signal instead of per-revision chatter
  // subscribe to it. Implementation lives in the hook so the
  // debounce + dedupe logic stays testable in isolation.
  useDebouncedEmbedSave({
    enabled: isEmbed,
    ready: readyDispatched.current,
    revId: currentRevId,
  });

  useEffect(() => {
    if (!isEmbed) return;
    if (loadError) {
      postEmbedMessage({ type: 'error', payload: { message: loadError } });
    }
  }, [isEmbed, loadError]);

  // Keep the page-jumper input synced with whatever the viewer says
  // is the current page — so when the user scrolls, the input
  // reflects the new state without manual editing.
  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const handlePageJump = () => {
    if (!pageCount) return;
    const n = parseInt(pageInput, 10);
    if (!Number.isFinite(n) || n < 1 || n > pageCount) {
      // Bad input: reset to whatever the current page is so the user
      // sees the rejection visually without an error popup.
      setPageInput(String(currentPage));
      return;
    }
    setGoToPage((prev) => ({ page: n, nonce: (prev?.nonce ?? 0) + 1 }));
  };

  /**
   * Selection callback: the user drew a rectangle while in highlight
   * mode. Fire `annotation.add` with the drawn rect, then bump the
   * revision key so the viewer reloads with the new annotation. Errors
   * surface inline; selection mode stays on so the user can highlight
   * multiple spans without re-clicking the toggle.
   */
  const onSelectionRect = useCallback(
    async (
      pageNumber: number,
      rect: [number, number, number, number]
    ) => {
      if (!documentId) return;
      // selectionMode drives which annotation kind we add. The overlay
      // only fires this when a mode is active, so a null check here
      // is defensive — fall back to highlight on any unexpected state.
      const kind =
        selectionMode === 'sticky' ? ('sticky' as const) : ('highlight' as const);
      setSelectionError(null);
      try {
        await applyOps(documentId, [
          { type: 'annotation.add', page: pageNumber, kind, rect },
        ]);
        setRevisionKey((k) => k + 1);
      } catch (err) {
        setSelectionError(err instanceof Error ? err.message : String(err));
      }
    },
    [documentId, selectionMode]
  );

  const inDocumentMode = Boolean(documentId);
  const src = inDocumentMode ? docBytes : file;

  return (
    <div className="container mx-auto max-w-5xl p-6 h-[calc(100vh-4rem)] flex flex-col gap-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Editor</h1>
          <p className="text-muted-foreground text-sm">
            {inDocumentMode
              ? 'Editing a stored document. Use the toolbar to rotate pages or add annotations.'
              : 'Drop a PDF below to preview it. Open a stored document via `?doc=<id>` to enable edit actions.'}
          </p>
        </div>
      </header>

      {!inDocumentMode && (
        <label
          className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
          htmlFor="editor-file-input"
        >
          <input
            id="editor-file-input"
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
            }}
          />
          {file ? (
            <span className="font-medium">{file.name}</span>
          ) : (
            <span className="text-muted-foreground">
              Click to choose a PDF, or drop one here.
            </span>
          )}
        </label>
      )}

      <EditorToolbar
        documentId={documentId}
        currentPage={currentPage}
        onAfterEdit={onAfterEdit}
        selectionMode={selectionMode}
        onSelectionModeChange={setSelectionMode}
        zoom={zoom}
        onZoomChange={setZoom}
      />

      {pageCount !== null && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePageJump();
          }}
          className="text-sm text-muted-foreground flex items-center gap-2"
          data-testid="editor-page-indicator"
        >
          <label htmlFor="page-jumper">Page</label>
          <input
            id="page-jumper"
            data-testid="page-jumper"
            type="number"
            min={1}
            max={pageCount}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={handlePageJump}
            className="w-16 rounded border px-2 py-0.5 text-center"
            aria-label={`Page number (1 to ${pageCount})`}
          />
          <span>of {pageCount}</span>
        </form>
      )}

      {inDocumentMode && (
        <RevisionsList
          documentId={documentId}
          refreshKey={revisionKey}
          onAfterRestore={onAfterEdit}
        />
      )}

      {inDocumentMode && (
        <CommentsList
          documentId={documentId}
          currentRevId={currentRevId}
          currentPage={currentPage}
          refreshKey={revisionKey}
        />
      )}

      {selectionMode === 'highlight' && (
        <p className="text-sm text-muted-foreground">
          Drag on a page to highlight. Click <strong>Highlight: on</strong> again to exit.
        </p>
      )}
      {selectionMode === 'sticky' && (
        <p className="text-sm text-muted-foreground">
          Click anywhere on a page to place a sticky note. Click{' '}
          <strong>Sticky: on</strong> again to exit.
        </p>
      )}

      {selectionError && (
        <div
          role="alert"
          className="p-3 border border-destructive/40 rounded-md bg-destructive/5 text-destructive text-sm"
        >
          Highlight failed: {selectionError}
        </div>
      )}

      {loadError && (
        <div
          role="alert"
          className="p-3 border border-destructive/40 rounded-md bg-destructive/5 text-destructive text-sm"
        >
          Could not load document: {loadError}
        </div>
      )}

      <div className="flex-1 border rounded-md overflow-hidden">
        <PdfViewer
          key={revisionKey}
          src={src}
          scale={zoom}
          selectionMode={inDocumentMode ? selectionMode : null}
          onSelectionRect={(pageNum, rect) => {
            void onSelectionRect(pageNum, rect);
          }}
          onCurrentPageChange={setCurrentPage}
          onPageCountChange={setPageCount}
          goToPage={goToPage}
        />
      </div>
    </div>
  );
}
