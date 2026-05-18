/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';

// Stub pdfjs-dist before importing the module so worker setup doesn't run.
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}));

vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({
  default: 'stub://worker.mjs',
}));

import * as pdfjsLib from 'pdfjs-dist';

import { loadPdf } from '../pdfjs';

describe('pdfjs facade', () => {
  it('configures the worker URL at import time', async () => {
    // Importing the module above set GlobalWorkerOptions.workerSrc to the
    // stubbed url. The contract is "non-empty after import".
    expect(pdfjsLib.GlobalWorkerOptions.workerSrc).toBeTruthy();
  });

  it('passes Uint8Array through to getDocument unchanged', async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const dummyDoc = { numPages: 0 };
    vi.mocked(pdfjsLib.getDocument).mockReturnValue({
      promise: Promise.resolve(dummyDoc),
    } as ReturnType<typeof pdfjsLib.getDocument>);

    const result = await loadPdf(bytes);

    expect(result).toBe(dummyDoc);
    expect(pdfjsLib.getDocument).toHaveBeenCalledWith({ data: bytes });
  });

  it('converts ArrayBuffer to Uint8Array', async () => {
    const buf = new Uint8Array([9, 8, 7]).buffer;
    vi.mocked(pdfjsLib.getDocument).mockReturnValue({
      promise: Promise.resolve({ numPages: 0 }),
    } as ReturnType<typeof pdfjsLib.getDocument>);

    await loadPdf(buf);

    const callArg = vi.mocked(pdfjsLib.getDocument).mock.lastCall?.[0] as {
      data: Uint8Array;
    };
    expect(callArg.data).toBeInstanceOf(Uint8Array);
    expect(Array.from(callArg.data)).toEqual([9, 8, 7]);
  });

  it('converts Blob to Uint8Array via arrayBuffer()', async () => {
    const blob = new Blob([new Uint8Array([42, 43])]);
    vi.mocked(pdfjsLib.getDocument).mockReturnValue({
      promise: Promise.resolve({ numPages: 0 }),
    } as ReturnType<typeof pdfjsLib.getDocument>);

    await loadPdf(blob);

    const callArg = vi.mocked(pdfjsLib.getDocument).mock.lastCall?.[0] as {
      data: Uint8Array;
    };
    expect(Array.from(callArg.data)).toEqual([42, 43]);
  });

  it('fetches a URL string and passes bytes to getDocument', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3, 4]).buffer),
    }) as unknown as typeof fetch;

    vi.mocked(pdfjsLib.getDocument).mockReturnValue({
      promise: Promise.resolve({ numPages: 0 }),
    } as ReturnType<typeof pdfjsLib.getDocument>);

    await loadPdf('/some/test.pdf');
    expect(globalThis.fetch).toHaveBeenCalledWith('/some/test.pdf');
  });

  it('rejects on non-OK fetch', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    }) as unknown as typeof fetch;
    await expect(loadPdf('/missing.pdf')).rejects.toThrow(/404/);
  });
});
