import { useEffect, useState } from 'react';

import {
  downloadRevisionUrl,
  listRevisions,
  restoreRevision,
  type EditorRevision,
} from '@/lib/editorApi';

interface RevisionsListProps {
  documentId: string | null;
  /**
   * Bumped by the parent every time an edit succeeds. We re-fetch
   * whenever this changes so the list stays in sync with the document
   * state, without the consumer having to manually invalidate.
   */
  refreshKey: number;
  /**
   * Called after a successful restore. The parent uses this to
   * re-fetch the document bytes (and bump its own revisionKey so the
   * viewer reloads + the list refreshes). The new Revision's id is
   * passed for telemetry / future "restored to X" UI.
   */
  onAfterRestore?: (newRevisionId: string) => void;
}

/**
 * Read-only revision history panel.
 *
 * Renders a list of past revisions for the current document with the
 * created-at timestamp, the optional commit-style message, and a
 * direct download link to that revision's bytes. The list is wrapped
 * in a collapsible `<details>` so it stays out of the way when the
 * user isn't reviewing history.
 *
 * What this does NOT do:
 *   - Restore-to-revision (the API doesn't expose that as a single op
 *     today; it'll arrive when revisions become first-class anchors
 *     for the multiplayer CRDT design).
 *   - Pagination (the backend supports `page`/`limit`; the typical
 *     editing session has <25 revisions, the default page size,
 *     which is the v0 ceiling).
 *   - Author display name (only the UUID is on the Revision today).
 *
 * All three are tracked follow-ups.
 */
export function RevisionsList({
  documentId,
  refreshKey,
  onAfterRestore,
}: RevisionsListProps) {
  const [revisions, setRevisions] = useState<EditorRevision[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  /** Id of the revision whose restore is in flight. Disables both
   *  the row's button and the others to prevent racing restores. */
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleRestore = (rev: EditorRevision) => {
    if (!documentId) return;
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        `Restore document to this revision? A new revision row will be added; nothing is lost.`
      )
    ) {
      return;
    }
    setRestoringId(rev.id);
    setRestoreError(null);
    restoreRevision(documentId, rev.id)
      .then((newRev) => {
        onAfterRestore?.(newRev.id);
      })
      .catch((err) => {
        setRestoreError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setRestoringId(null);
      });
  };

  useEffect(() => {
    if (!documentId) {
      setRevisions(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    listRevisions(documentId)
      .then((revs) => {
        if (cancelled) return;
        setRevisions(revs);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [documentId, refreshKey]);

  if (!documentId) return null;

  return (
    <details
      className="border rounded-md bg-card text-sm"
      data-testid="revisions-list"
    >
      <summary className="px-3 py-2 cursor-pointer select-none font-medium">
        Revision history{revisions ? ` (${revisions.length})` : ''}
      </summary>
      <div className="px-3 py-2 border-t">
        {loading && !revisions && (
          <p className="text-muted-foreground" data-testid="revisions-loading">
            Loading…
          </p>
        )}
        {error && (
          <p role="alert" className="text-destructive">
            Could not load revisions: {error}
          </p>
        )}
        {revisions && revisions.length === 0 && (
          <p className="text-muted-foreground">
            No edits yet. Use the toolbar above to make changes.
          </p>
        )}
        {revisions && revisions.length > 0 && (
          <ul className="space-y-2" data-testid="revisions-list-items">
            {revisions.map((rev) => (
              <li
                key={rev.id}
                className="flex items-center gap-3"
                data-testid={`revision-${rev.id}`}
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {formatTimestamp(rev.createdAt)}
                </span>
                <span className="flex-1 truncate">
                  {rev.message?.trim() || (
                    <em className="text-muted-foreground">
                      no message
                    </em>
                  )}
                </span>
                <a
                  href={downloadRevisionUrl(documentId, rev.id)}
                  download
                  className="text-primary hover:underline whitespace-nowrap"
                  aria-label={`Download revision from ${formatTimestamp(
                    rev.createdAt
                  )}`}
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => handleRestore(rev)}
                  disabled={restoringId !== null}
                  className="text-primary hover:underline whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={`Restore document to revision from ${formatTimestamp(
                    rev.createdAt
                  )}`}
                >
                  {restoringId === rev.id ? 'Restoring…' : 'Restore'}
                </button>
              </li>
            ))}
          </ul>
        )}
        {restoreError && (
          <p
            role="alert"
            className="mt-2 text-destructive"
            data-testid="restore-error"
          >
            Restore failed: {restoreError}
          </p>
        )}
      </div>
    </details>
  );
}

/**
 * Format an ISO timestamp as `YYYY-MM-DD HH:MM` in the user's local
 * tz. Locale-independent on purpose — server uses UTC, but humans
 * read dates in their wall-clock time. If the input is unparseable
 * (defensive: a malformed row from a future migration), surface the
 * raw string rather than throwing.
 */
function formatTimestamp(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}
