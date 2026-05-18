import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  addComment,
  listComments,
  resolveComment,
  type EditorComment,
} from '@/lib/editorApi';
import { useCollab } from '@/hooks/useCollab';

interface CommentsListProps {
  documentId: string | null;
  /**
   * The revision the new comment will anchor to. Required by the
   * backend (`revId` is a UUID). When null, the add-form is disabled
   * and the user is prompted to make an edit first — a fresh
   * document has no revisions yet, so there's nothing to anchor to.
   */
  currentRevId: string | null;
  /**
   * The page the new comment will anchor to. The list itself shows
   * all comments regardless of page; this only seeds the add-form.
   */
  currentPage: number;
  /**
   * Bumped by the parent (e.g. after an edit) so we re-fetch when
   * the document changes underneath us.
   */
  refreshKey: number;
}

/**
 * Comments panel — add / list / resolve, with single-depth threaded
 * replies and live updates over WS.
 *
 * Live updates: the hook `useCollab(documentId)` opens a collab
 * websocket. editor-service publishes `editor.comments.<docID>`
 * NATS events when comments are added or resolved; collab-service
 * forwards them as WS frames; this component decodes the JSON and
 * folds them into local state. We dedupe by comment id so a
 * user's own write (already applied locally via the optimistic
 * setState in handleSubmit) isn't double-added when the same
 * event arrives over the wire.
 *
 * Out of scope for v0:
 *   - Replies-to-replies (the backend rejects them; we hide the
 *     "Reply" affordance on existing replies in the UI to match).
 *   - Per-rect / per-span anchors (we ship page-level anchors only;
 *     selection-driven span anchors arrive when the sPDOM addressing
 *     UX lands).
 */

/** JSON wire shape emitted by editor-service for live updates. */
type CommentWireEvent =
  | { kind: 'comment.added'; docId: string; comment: EditorComment }
  | { kind: 'comment.resolved'; docId: string; id: string };

function parseCommentEvent(payload: Uint8Array): CommentWireEvent | null {
  try {
    const text = new TextDecoder().decode(payload);
    const obj = JSON.parse(text);
    if (
      obj &&
      typeof obj === 'object' &&
      (obj.kind === 'comment.added' || obj.kind === 'comment.resolved')
    ) {
      return obj as CommentWireEvent;
    }
  } catch {
    // Not JSON — could be a future Yjs frame. Silently ignore.
  }
  return null;
}
export function CommentsList({
  documentId,
  currentRevId,
  currentPage,
  refreshKey,
}: CommentsListProps) {
  const [comments, setComments] = useState<EditorComment[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  // The comment id the user is replying to, plus the in-progress
  // reply body. Only one reply form is open at a time — keeping it
  // tight makes the UI obvious and avoids losing draft state on
  // accidental focus changes.
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Live updates over WS. The hook delivers raw binary frames;
  // we decode JSON and ignore anything that doesn't match the
  // comment-event shape (forward-compatible with future Yjs
  // frames sharing the same wire).
  const handleLiveFrame = useCallback((payload: Uint8Array) => {
    const ev = parseCommentEvent(payload);
    if (!ev) return;
    if (ev.kind === 'comment.added') {
      setComments((prev) => {
        if (!prev) return prev;
        // Dedupe: a user's own write was already optimistically
        // added in handleSubmit; the NATS echo would otherwise
        // duplicate the row.
        if (prev.some((c) => c.id === ev.comment.id)) {
          return prev;
        }
        // Top-level newest-first (matches the backend sort);
        // replies append (matches the per-thread oldest-first
        // ordering computed in groupThreads).
        return ev.comment.parentCommentId
          ? [...prev, ev.comment]
          : [ev.comment, ...prev];
      });
    } else if (ev.kind === 'comment.resolved') {
      setComments((prev) =>
        prev
          ? prev.map((c) => (c.id === ev.id ? { ...c, resolved: true } : c))
          : prev
      );
    }
  }, []);

  useCollab(documentId, { onMessage: handleLiveFrame });

  useEffect(() => {
    if (!documentId) {
      setComments(null);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    setLoadError(null);
    listComments(documentId)
      .then((cs) => {
        if (cancelled) return;
        setComments(cs);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [documentId, refreshKey]);

  // Group replies under their parent so the renderer doesn't need
  // to scan the list for each parent. The backend returns flat
  // newest-first; we preserve that ordering for top-level comments
  // and sort replies oldest-first within each thread (conventional
  // chat-style — earlier replies on top).
  const threads = useMemo(() => groupThreads(comments), [comments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId || !currentRevId) return;
    const trimmed = body.trim();
    if (trimmed.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    addComment(
      documentId,
      currentRevId,
      { type: 'page', page: currentPage },
      trimmed
    )
      .then((newComment) => {
        setBody('');
        // Insert at the top (matches the backend's newest-first sort)
        // so the user sees their comment immediately without a refetch.
        setComments((prev) => (prev ? [newComment, ...prev] : [newComment]));
      })
      .catch((err) => {
        setSubmitError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const handleResolve = (id: string) => {
    if (!documentId) return;
    setResolvingId(id);
    resolveComment(documentId, id)
      .then(() => {
        setComments((prev) =>
          prev
            ? prev.map((c) => (c.id === id ? { ...c, resolved: true } : c))
            : prev
        );
      })
      .catch((err) => {
        setSubmitError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setResolvingId(null);
      });
  };

  const openReply = (parentId: string) => {
    setReplyParentId(parentId);
    setReplyBody('');
    setReplyError(null);
  };

  const cancelReply = () => {
    setReplyParentId(null);
    setReplyBody('');
    setReplyError(null);
  };

  const handleReplySubmit = (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!documentId || !currentRevId) return;
    const trimmed = replyBody.trim();
    if (trimmed.length === 0) return;
    setReplySubmitting(true);
    setReplyError(null);
    addComment(
      documentId,
      currentRevId,
      { type: 'page', page: currentPage },
      trimmed,
      parentId
    )
      .then((newReply) => {
        // Replies render under their parent in chronological order.
        // We append rather than prepend so the local optimistic order
        // matches what a refetch would give us.
        setComments((prev) => (prev ? [...prev, newReply] : [newReply]));
        cancelReply();
      })
      .catch((err) => {
        setReplyError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setReplySubmitting(false);
      });
  };

  if (!documentId) return null;

  return (
    <details
      className="border rounded-md bg-card text-sm"
      data-testid="comments-list"
    >
      <summary className="px-3 py-2 cursor-pointer select-none font-medium">
        Comments{comments ? ` (${comments.length})` : ''}
      </summary>
      <div className="px-3 py-2 border-t space-y-3">
        <form onSubmit={handleSubmit} className="space-y-2">
          <label htmlFor="new-comment-body" className="sr-only">
            Comment body
          </label>
          <textarea
            id="new-comment-body"
            data-testid="new-comment-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              currentRevId
                ? `Add a comment on page ${currentPage}…`
                : 'Make an edit first — comments need a revision to anchor to.'
            }
            disabled={!currentRevId || submitting}
            rows={2}
            className="w-full rounded border px-2 py-1 text-sm disabled:bg-muted/30 disabled:cursor-not-allowed"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!currentRevId || submitting || body.trim() === ''}
              className="px-3 py-1 rounded border text-primary hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Posting…' : 'Post comment'}
            </button>
            {!currentRevId && (
              <span className="text-muted-foreground text-xs">
                No revision yet — make any edit to enable comments.
              </span>
            )}
          </div>
          {submitError && (
            <p
              role="alert"
              className="text-destructive"
              data-testid="comment-submit-error"
            >
              {submitError}
            </p>
          )}
        </form>

        {loadError && (
          <p role="alert" className="text-destructive">
            Could not load comments: {loadError}
          </p>
        )}
        {threads.length === 0 && comments && (
          <p className="text-muted-foreground">No comments yet.</p>
        )}
        {threads.length > 0 && (
          <ul className="space-y-2" data-testid="comments-list-items">
            {threads.map(({ parent, replies }) => (
              <li
                key={parent.id}
                className={`rounded border px-2 py-1.5 ${
                  parent.resolved ? 'bg-muted/30 text-muted-foreground' : ''
                }`}
                data-testid={`comment-${parent.id}`}
              >
                <CommentRow
                  comment={parent}
                  canResolve={!parent.resolved}
                  resolving={resolvingId === parent.id}
                  onResolve={() => handleResolve(parent.id)}
                  onReply={() => openReply(parent.id)}
                  canReply={Boolean(currentRevId)}
                  showReplyButton
                />
                {replies.length > 0 && (
                  <ul
                    className="mt-2 ml-4 border-l pl-2 space-y-1.5"
                    data-testid={`replies-${parent.id}`}
                  >
                    {replies.map((r) => (
                      <li
                        key={r.id}
                        className={`text-xs ${
                          r.resolved ? 'text-muted-foreground' : ''
                        }`}
                        data-testid={`reply-${r.id}`}
                      >
                        <CommentRow
                          comment={r}
                          canResolve={!r.resolved}
                          resolving={resolvingId === r.id}
                          onResolve={() => handleResolve(r.id)}
                          onReply={() => undefined}
                          canReply={false}
                          showReplyButton={false}
                        />
                      </li>
                    ))}
                  </ul>
                )}
                {replyParentId === parent.id && (
                  <form
                    onSubmit={(e) => handleReplySubmit(e, parent.id)}
                    className="mt-2 ml-4 border-l pl-2 space-y-1"
                    data-testid={`reply-form-${parent.id}`}
                  >
                    <label
                      htmlFor={`reply-body-${parent.id}`}
                      className="sr-only"
                    >
                      Reply body
                    </label>
                    <textarea
                      id={`reply-body-${parent.id}`}
                      data-testid={`reply-body-${parent.id}`}
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Write a reply…"
                      disabled={replySubmitting}
                      rows={2}
                      className="w-full rounded border px-2 py-1 text-xs disabled:bg-muted/30"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={
                          replySubmitting || replyBody.trim() === ''
                        }
                        className="px-2 py-0.5 rounded border text-primary hover:bg-muted text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {replySubmitting ? 'Posting…' : 'Post reply'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelReply}
                        disabled={replySubmitting}
                        className="text-muted-foreground hover:underline text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                    {replyError && (
                      <p
                        role="alert"
                        className="text-destructive text-xs"
                        data-testid={`reply-error-${parent.id}`}
                      >
                        {replyError}
                      </p>
                    )}
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

interface Thread {
  parent: EditorComment;
  replies: EditorComment[];
}

/**
 * Group comments into top-level threads with their replies. The
 * backend returns a flat list newest-first; we preserve that order
 * for top-level comments and order replies oldest-first within each
 * thread (matches chat conventions and the natural read order of a
 * conversation).
 *
 * Replies whose parent isn't in the visible page are surfaced as if
 * they were top-level — this only happens when pagination splits a
 * thread, which is rare for v0 since pagination isn't wired into
 * this component yet.
 */
function groupThreads(comments: EditorComment[] | null): Thread[] {
  if (!comments) return [];
  const byId = new Map<string, EditorComment>();
  for (const c of comments) byId.set(c.id, c);

  const repliesByParent = new Map<string, EditorComment[]>();
  const topLevel: EditorComment[] = [];
  for (const c of comments) {
    if (c.parentCommentId && byId.has(c.parentCommentId)) {
      const arr = repliesByParent.get(c.parentCommentId) ?? [];
      arr.push(c);
      repliesByParent.set(c.parentCommentId, arr);
    } else {
      topLevel.push(c);
    }
  }
  return topLevel.map((parent) => ({
    parent,
    replies: (repliesByParent.get(parent.id) ?? []).slice().sort((a, b) => {
      // Oldest first within a thread.
      return a.createdAt.localeCompare(b.createdAt);
    }),
  }));
}

interface CommentRowProps {
  comment: EditorComment;
  canResolve: boolean;
  resolving: boolean;
  onResolve: () => void;
  canReply: boolean;
  onReply: () => void;
  showReplyButton: boolean;
}

function CommentRow({
  comment,
  canResolve,
  resolving,
  onResolve,
  canReply,
  onReply,
  showReplyButton,
}: CommentRowProps) {
  return (
    <>
      <div className="flex items-start gap-2">
        <span className="flex-1 whitespace-pre-wrap break-words">
          {comment.body}
        </span>
        {canResolve && (
          <button
            type="button"
            onClick={onResolve}
            disabled={resolving}
            className="text-primary hover:underline whitespace-nowrap text-xs disabled:opacity-50"
            aria-label="Resolve comment"
            data-testid={`resolve-${comment.id}`}
          >
            {resolving ? 'Resolving…' : 'Resolve'}
          </button>
        )}
        {comment.resolved && <span className="text-xs italic">resolved</span>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground font-mono">
        {formatAuthor(comment)} · {formatPageAnchor(comment.anchor)} ·{' '}
        {formatTimestamp(comment.createdAt)}
        {showReplyButton && canReply && (
          <>
            {' · '}
            <button
              type="button"
              onClick={onReply}
              className="text-primary hover:underline"
              data-testid={`open-reply-${comment.id}`}
            >
              Reply
            </button>
          </>
        )}
      </p>
    </>
  );
}

function formatAuthor(comment: EditorComment): string {
  // Prefer the resolved display name from auth-service. Fall back
  // to a short prefix of the raw UUID so the row still has *some*
  // attribution (8 chars is enough for ambient disambiguation
  // without dragging a 36-char UUID across the layout).
  if (comment.authorDisplayName && comment.authorDisplayName.trim().length > 0) {
    return comment.authorDisplayName;
  }
  const id = comment.authorUserId ?? '';
  return id.length > 8 ? id.slice(0, 8) + '…' : id;
}

function formatPageAnchor(anchor: EditorComment['anchor']): string {
  // We only render the page-level anchor shape for now; other shapes
  // (span anchors, future spatial anchors) fall back to a generic
  // label so the comment still has *some* context.
  if (anchor && typeof anchor === 'object' && 'type' in anchor) {
    const a = anchor as { type: string; page?: number };
    if (a.type === 'page' && typeof a.page === 'number') {
      return `page ${a.page}`;
    }
  }
  return 'anchor';
}

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
