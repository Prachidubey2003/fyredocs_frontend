import { describe, it, expect } from 'vitest';
import { friendlyError } from './friendlyError';

describe('friendlyError', () => {
  it('maps known [CODE] prefixes to friendly copy', () => {
    expect(friendlyError('[CONVERSION_FAILED] failed to parse signature watermark: pdfcpu: ...')).toBe(
      "We couldn't process this file. It may be corrupted, password-protected, or in an unsupported format. Please try a different file."
    );
    expect(friendlyError('[TIMEOUT] context deadline exceeded')).toBe(
      'This file took too long to process. Please try again, or use a smaller file.'
    );
    expect(friendlyError('[UNSUPPORTED_TOOL] ocr-pdf')).toBe(
      "This operation isn't supported for this file."
    );
  });

  it('falls back to the generic message for an unknown [CODE]', () => {
    expect(friendlyError('[SOMETHING_NEW] weird')).toBe(
      'Something went wrong while processing your file. Please try again.'
    );
  });

  it('converts obviously technical strings (no code) to the generic message', () => {
    expect(friendlyError('pdfcpu: ambiguous parameter prefix "sc"')).toBe(
      'Something went wrong while processing your file. Please try again.'
    );
    expect(friendlyError('ghostscript exit status 1')).toBe(
      'Something went wrong while processing your file. Please try again.'
    );
  });

  it('passes through already-friendly text', () => {
    const msg = 'This file is larger than the 25MB limit.';
    expect(friendlyError(msg)).toBe(msg);
  });

  it('returns undefined for empty/nullish input', () => {
    expect(friendlyError(undefined)).toBeUndefined();
    expect(friendlyError(null)).toBeUndefined();
    expect(friendlyError('')).toBeUndefined();
    expect(friendlyError('   ')).toBeUndefined();
  });
});
