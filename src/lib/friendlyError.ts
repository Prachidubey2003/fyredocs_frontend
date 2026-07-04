/**
 * Converts a raw backend/technical error string into a user-friendly message.
 *
 * The backend now returns friendly text for processing failures, but this is a
 * defensive layer that also covers: legacy job records whose `failure_reason`
 * still holds a raw `[CODE] detail` string, upload/network errors, and any
 * service not yet updated. Auth has its own mapping (see `authErrors.ts`).
 *
 * Returns `undefined` for empty input so callers can keep their own default.
 */

// Keep these in sync with the backend `friendlyMessage` (worker.go) copy.
const CODE_MESSAGES: Record<string, string> = {
  TIMEOUT: 'This file took too long to process. Please try again, or use a smaller file.',
  UNSUPPORTED_TOOL: "This operation isn't supported for this file.",
  CONVERSION_FAILED:
    "We couldn't process this file. It may be corrupted, password-protected, or in an unsupported format. Please try a different file.",
};

const GENERIC = 'Something went wrong while processing your file. Please try again.';

// Substrings that mark a raw technical error we should never show verbatim.
const TECHNICAL_MARKERS = [
  'pdfcpu',
  'ghostscript',
  'libreoffice',
  'tesseract',
  'poppler',
  'exit status',
  'deadline exceeded',
  'panic:',
  'runtime error',
  'no such file',
];

export function friendlyError(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  // Backend prefixes failures as "[CODE] detail" — map the code to friendly copy.
  const codeMatch = trimmed.match(/^\[([A-Z_]+)\]/);
  if (codeMatch) {
    return CODE_MESSAGES[codeMatch[1]] ?? GENERIC;
  }

  // No code prefix but obviously technical → generic friendly message.
  const lower = trimmed.toLowerCase();
  if (TECHNICAL_MARKERS.some((marker) => lower.includes(marker))) {
    return GENERIC;
  }

  // Already user-friendly (new backend messages, validation text) → pass through.
  return trimmed;
}
