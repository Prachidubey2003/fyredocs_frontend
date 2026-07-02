import { apiJson, apiRequest } from '@/lib/apiClient';

/**
 * Client for S3-presigned multipart uploads.
 *
 * Flow: POST /api/upload/init → parallel PUTs of raw blobs to presigned URLs
 * (same-origin, gateway proxies /uploads/* to MinIO) → POST
 * /api/upload/{uploadId}/complete with the collected part ETags.
 */

export interface PresignedPart {
  /** 1-based part number (S3 convention). */
  partNumber: number;
  url: string;
}

export interface InitUploadResult {
  uploadId: string;
  key: string;
  partSize: number;
  totalParts: number;
  urlExpiresAt: string;
  parts: PresignedPart[];
}

export interface RefreshPartUrlsResult {
  uploadId: string;
  partSize: number;
  parts: PresignedPart[];
}

export interface CompleteUploadResult {
  uploadId: string;
  fileName: string;
  size: number;
  complete: boolean;
}

export type PutPartErrorKind = 'expired' | 'no-etag' | 'http' | 'network';

/** Typed failure from a presigned part PUT so callers can branch on the cause. */
export class PutPartError extends Error {
  kind: PutPartErrorKind;
  status?: number;

  constructor(kind: PutPartErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'PutPartError';
    this.kind = kind;
    this.status = status;
  }
}

/** Initialize a multipart upload session and receive presigned part URLs. */
export const initUpload = async (file: File, signal?: AbortSignal): Promise<InitUploadResult> => {
  const response = await apiJson<{ data: InitUploadResult }>('/api/upload/init', {
    method: 'POST',
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type || 'application/octet-stream',
    }),
    signal,
  });
  return response.data;
};

/** Fetch fresh presigned URLs for the given parts (all parts when empty). */
export const refreshPartUrls = async (
  uploadId: string,
  partNumbers: number[],
  signal?: AbortSignal
): Promise<RefreshPartUrlsResult> => {
  const query =
    partNumbers.length > 0
      ? `?partNumbers=${encodeURIComponent(partNumbers.join(','))}`
      : '';
  const response = await apiJson<{ data: RefreshPartUrlsResult }>(
    `/api/upload/${uploadId}/parts${query}`,
    { method: 'GET', signal }
  );
  return response.data;
};

/** Finalize the multipart upload with the collected part ETags. */
export const completeUpload = async (
  uploadId: string,
  parts: { partNumber: number; etag: string }[],
  signal?: AbortSignal
): Promise<CompleteUploadResult> => {
  const response = await apiJson<{ data: CompleteUploadResult }>(
    `/api/upload/${uploadId}/complete`,
    {
      method: 'POST',
      body: JSON.stringify({ parts }),
      signal,
    }
  );
  return response.data;
};

/** Abort an upload session. Fire-and-forget: errors are swallowed. */
export const abortUpload = (uploadId: string): void => {
  void apiRequest(`/api/upload/${uploadId}`, { method: 'DELETE' }).catch(() => undefined);
};

const stripQuotes = (etag: string) => etag.replace(/^"+|"+$/g, '');

const abortError = () =>
  new DOMException('The upload was aborted.', 'AbortError');

/**
 * PUT a raw blob to a presigned URL via XMLHttpRequest (fetch lacks upload
 * progress). Resolves the de-quoted ETag response header.
 *
 * Rejections:
 * - abort           → DOMException('AbortError') (maps to the paused state)
 * - HTTP 403        → PutPartError kind 'expired' (presigned URL expired)
 * - missing ETag    → PutPartError kind 'no-etag' (gateway misconfiguration)
 * - other non-2xx   → PutPartError kind 'http' with status
 * - network failure → PutPartError kind 'network'
 */
export const putPart = (
  url: string,
  blob: Blob,
  options: { signal?: AbortSignal; onProgress?: (loaded: number) => void } = {}
): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const { signal, onProgress } = options;

    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    // Presigned URLs are pre-authorized — never attach cookies/credentials.
    xhr.withCredentials = false;

    const onAbort = () => xhr.abort();
    signal?.addEventListener('abort', onAbort);
    const cleanup = () => signal?.removeEventListener('abort', onAbort);

    xhr.upload.onprogress = (event: ProgressEvent) => {
      onProgress?.(event.loaded);
    };

    xhr.onload = () => {
      cleanup();
      if (xhr.status === 403) {
        reject(new PutPartError('expired', 'The upload URL has expired.', 403));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new PutPartError('http', `Part upload failed with status ${xhr.status}.`, xhr.status)
        );
        return;
      }
      const etag = xhr.getResponseHeader('ETag');
      if (!etag) {
        reject(
          new PutPartError(
            'no-etag',
            'Upload storage did not return an ETag header — the storage gateway may be misconfigured (the ETag header must be exposed to the browser).'
          )
        );
        return;
      }
      resolve(stripQuotes(etag));
    };

    xhr.onerror = () => {
      cleanup();
      reject(new PutPartError('network', 'Network error while uploading part.'));
    };

    xhr.onabort = () => {
      cleanup();
      reject(abortError());
    };

    // Send the raw blob — no manual Content-Type (must match the presigned signature).
    xhr.send(blob);
  });
