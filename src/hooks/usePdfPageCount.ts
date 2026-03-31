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
