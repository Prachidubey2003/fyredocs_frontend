import { apiJson, apiRequest, buildApiUrl } from './apiClient';

/**
 * Wire-format types for editor-service. These mirror the OpenAPI spec
 * at docs/developer/swagger/openapi.yaml — keep them in sync until we
 * generate the TS SDK from the spec (Phase 4).
 */

/** Op accepted by `POST /v1/documents/:id/edit`. */
export type EditorOp =
  | {
      type: 'page.rotate';
      page: number;
      rotation: 0 | 90 | 180 | 270;
    }
  | {
      type: 'page.delete';
      /** 1-indexed page number. The backend refuses deleting the last page. */
      page: number;
    }
  | {
      type: 'page.insert';
      /**
       * 1-indexed page number to insert AFTER. Use `0` to insert
       * before the first page.
       */
      afterPage: number;
    }
  | {
      type: 'annotation.add';
      page: number;
      kind?:
        | 'highlight'
        | 'underline'
        | 'strikeout'
        | 'squiggly'
        | 'square'
        | 'sticky';
      /** [x0, y0, x1, y1] in PDF user-space points (origin bottom-left). */
      rect: [number, number, number, number];
      /** Optional RGB color in [0,1]^3. */
      color?: [number, number, number];
      contents?: string;
    }
  | {
      /**
       * Freehand strokes → PDF /Ink annotation. The rect is
       * auto-derived from the stroke bounding box on the server;
       * callers may omit it.
       */
      type: 'annotation.add';
      page: number;
      kind: 'freehand';
      /** Each entry is a flat [x1, y1, x2, y2, …] stroke, >= 2 points. */
      strokes: number[][];
      color?: [number, number, number];
      contents?: string;
    }
  | {
      /**
       * Callout text box → PDF /FreeText with /IT /FreeTextCallout.
       * The callout line goes from `anchor` to the rect corner
       * nearest the anchor.
       */
      type: 'annotation.add';
      page: number;
      kind: 'callout';
      rect: [number, number, number, number];
      /** [x, y] point being pointed at. */
      anchor: [number, number];
      color?: [number, number, number];
      contents?: string;
    }
  | {
      /**
       * Locate the first `(find) Tj` on the page and rewrite it to
       * `(replace) Tj`. v0 constraints (each surfaces as a 400 with
       * a specific message):
       *   - /Contents must be a single indirect-ref stream
       *   - the stream must be uncompressed
       *   - only plain Tj literals match (TJ arrays skipped)
       *   - no width validation — longer replacements may visually
       *     overrun
       */
      type: 'text.replace';
      page: number;
      find: string;
      replace: string;
    };

export interface EditorDocument {
  id: string;
  ownerUserId: string;
  title: string;
  currentRevId?: string | null;
  sizeBytes: number;
  pageCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface EditorRevision {
  id: string;
  documentId: string;
  parentRevId?: string | null;
  authorUserId: string;
  message?: string;
  createdAt: string;
}

/** Anchor for a comment. v0 supports page-level anchors only. */
export type CommentAnchor =
  | { type: 'page'; page: number }
  | { type: 'span'; nodeId: string; offsetStart: number; offsetEnd: number };

export interface EditorComment {
  id: string;
  documentId: string;
  revId: string;
  anchor: CommentAnchor | Record<string, unknown>;
  body: string;
  authorUserId: string;
  /**
   * Best-effort display name for the author, resolved from
   * auth-service at read time. Empty / absent when the lookup
   * failed or auth-service isn't configured — render the raw
   * `authorUserId` (typically truncated) in that case.
   */
  authorDisplayName?: string;
  /**
   * Set when this comment is a reply. Replies sit under their parent
   * in the UI; v0 enforces single-depth threading (a reply cannot
   * itself be replied to).
   */
  parentCommentId?: string;
  resolved: boolean;
  createdAt: string;
}

/** Wraps the standard `{success, message, data}` response envelope. */
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
}

const EDITOR_BASE = '/api/editor/v1';

const unwrap = <T>(env: ApiEnvelope<T>): T => {
  if (!env.success || env.data === undefined) {
    throw new Error(env.message || 'Editor request failed');
  }
  return env.data;
};

/**
 * Fetch a document's metadata (does NOT include the PDF bytes — call
 * [downloadDocumentUrl] / [fetchDocumentBytes] for those).
 */
export async function getDocument(id: string): Promise<EditorDocument> {
  const env = await apiRequest<ApiEnvelope<EditorDocument>>(
    `${EDITOR_BASE}/documents/${encodeURIComponent(id)}`
  );
  return unwrap(env);
}

/**
 * Apply one or more sPDOM ops to a document. Returns the new
 * Revision. Per editor-service the request is bounded to 64 ops; the
 * backend will reject oversized requests with 400 INVALID_INPUT.
 */
export async function applyOps(
  id: string,
  ops: EditorOp[],
  message?: string
): Promise<EditorRevision> {
  const env = await apiJson<ApiEnvelope<EditorRevision>>(
    `${EDITOR_BASE}/documents/${encodeURIComponent(id)}/edit`,
    {
      method: 'POST',
      body: JSON.stringify({ ops, message }),
    }
  );
  return unwrap(env);
}

/**
 * Restore a document to a previous revision. The backend creates a
 * new revision whose bytes copy `revId`'s bytes and points
 * `Document.CurrentRevID` at it; the returned `EditorRevision` is
 * the NEW row (not the target).
 */
export async function restoreRevision(
  id: string,
  revId: string
): Promise<EditorRevision> {
  const env = await apiJson<ApiEnvelope<EditorRevision>>(
    `${EDITOR_BASE}/documents/${encodeURIComponent(id)}/revisions/${encodeURIComponent(revId)}/restore`,
    { method: 'POST' }
  );
  return unwrap(env);
}

/**
 * List comments on a document, newest-first. Pass `resolved=true` or
 * `resolved=false` to filter; omit for both.
 */
export async function listComments(
  id: string,
  opts: { resolved?: boolean } = {}
): Promise<EditorComment[]> {
  const params = new URLSearchParams();
  if (opts.resolved !== undefined) {
    params.set('resolved', String(opts.resolved));
  }
  const qs = params.toString();
  const env = await apiRequest<ApiEnvelope<EditorComment[]>>(
    `${EDITOR_BASE}/documents/${encodeURIComponent(id)}/comments${qs ? `?${qs}` : ''}`
  );
  return unwrap(env);
}

/**
 * Add a comment to a document. `revId` is required by the backend —
 * comments anchor to a specific revision so they survive subsequent
 * edits. `anchor` is opaque JSON; v0 uses a page-level anchor shape.
 *
 * Pass `parentCommentId` to post a reply. The backend rejects nested
 * replies (single-depth only) with 400 `NESTED_REPLY` and unknown
 * parents with 404 `PARENT_NOT_FOUND`.
 */
export async function addComment(
  id: string,
  revId: string,
  anchor: CommentAnchor,
  body: string,
  parentCommentId?: string
): Promise<EditorComment> {
  const env = await apiJson<ApiEnvelope<EditorComment>>(
    `${EDITOR_BASE}/documents/${encodeURIComponent(id)}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({
        revId,
        anchor,
        body,
        ...(parentCommentId ? { parentCommentId } : {}),
      }),
    }
  );
  return unwrap(env);
}

/** Mark a comment as resolved. Returns nothing on success (204). */
export async function resolveComment(id: string, commentId: string): Promise<void> {
  await apiRequest<void>(
    `${EDITOR_BASE}/documents/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}/resolve`,
    { method: 'POST' }
  );
}

/** List revisions for a document, newest-first. */
export async function listRevisions(
  id: string,
  page = 1,
  limit = 25
): Promise<EditorRevision[]> {
  const env = await apiRequest<ApiEnvelope<EditorRevision[]>>(
    `${EDITOR_BASE}/documents/${encodeURIComponent(id)}/revisions?page=${page}&limit=${limit}`
  );
  return unwrap(env);
}

/**
 * Absolute URL of the download endpoint. We return the URL rather than
 * fetching, so callers can either:
 *   - hand it to `<a href>` for a true browser download (with the
 *     Content-Disposition prompt), OR
 *   - pass it to the PDF viewer for in-page rendering, OR
 *   - feed it to [fetchDocumentBytes] for blob-based use.
 */
export function downloadDocumentUrl(id: string): string {
  return buildApiUrl(`${EDITOR_BASE}/documents/${encodeURIComponent(id)}/download`);
}

export function downloadRevisionUrl(id: string, revId: string): string {
  return buildApiUrl(
    `${EDITOR_BASE}/documents/${encodeURIComponent(id)}/revisions/${encodeURIComponent(revId)}/download`
  );
}

/**
 * Fetch the document bytes as an ArrayBuffer. Used by the PDF viewer
 * when we want in-memory rendering rather than a browser-driven
 * download. Sends credentials so the cookie-auth flow works.
 */
export async function fetchDocumentBytes(id: string): Promise<ArrayBuffer> {
  const response = await fetch(downloadDocumentUrl(id), {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`download failed: HTTP ${response.status}`);
  }
  return response.arrayBuffer();
}
