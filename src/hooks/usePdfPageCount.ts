/**
 * Reads a PDF's page count in the browser, for options panels that need it (page
 * ranges, split points).
 *
 * SWALLOWS ALL ERRORS AND RETURNS null. A corrupt, encrypted, or non-PDF file
 * simply yields no count. That is deliberate — the count is an input hint, and
 * blocking the whole panel because it could not be read would be worse than
 * omitting it — but it means callers cannot distinguish "not a PDF" from "not
 * loaded yet". Treat null as "unknown" and keep the field usable.
 */
import { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';

interface PdfPageCountState {
  pageCount: number | null;
  isLoading: boolean;
}

export function usePdfPageCount() {
  const [state, setState] = useState<PdfPageCountState>({
    pageCount: null,
    isLoading: false,
  });

  const readPageCount = useCallback(async (file: File): Promise<number | null> => {
    setState({ pageCount: null, isLoading: true });
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();
      setState({ pageCount: count, isLoading: false });
      return count;
    } catch {
      setState({ pageCount: null, isLoading: false });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ pageCount: null, isLoading: false });
  }, []);

  return { ...state, readPageCount, reset };
}
