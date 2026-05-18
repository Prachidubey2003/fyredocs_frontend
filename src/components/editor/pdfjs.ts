/**
 * pdfjs-dist setup, isolated here so the rest of the editor module imports
 * a thin facade. When we migrate from pdf.js to PDFium-WASM (plan §5.3, for
 * server/client pixel parity), only this file changes; component code stays
 * stable.
 *
 * Vite-specific note: the worker URL is loaded via `?url` so Vite emits it
 * as a hashed static asset and serves it from the build output. No
 * runtime CDN dependency.
 */
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure the worker once per page load. Idempotent — pdfjs-dist tolerates
// reassignment if a hot-reload re-runs this module.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export type PdfSource = string | URL | ArrayBuffer | Uint8Array | Blob | File;

/**
 * Load a PDF document. Returns a `PDFDocumentProxy` (a handle into the
 * pdf.js document) that callers must `destroy()` when done.
 */
export async function loadPdf(src: PdfSource): Promise<PDFDocumentProxy> {
  const data = await coerceToBytes(src);
  const task = pdfjsLib.getDocument({ data });
  return task.promise;
}

async function coerceToBytes(src: PdfSource): Promise<Uint8Array> {
  if (src instanceof Uint8Array) return src;
  if (src instanceof ArrayBuffer) return new Uint8Array(src);
  if (src instanceof Blob) return new Uint8Array(await src.arrayBuffer());
  // string / URL → fetch
  const url = typeof src === 'string' ? src : src.toString();
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`pdfjs: fetch failed: ${res.status} ${res.statusText}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

export type { PDFDocumentProxy, PDFPageProxy };

/**
 * Render a single PDF page to a Canvas. Returns the rendered viewport so the
 * caller can size its container.
 */
export async function renderPage(
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale: number
): Promise<{ width: number; height: number }> {
  const viewport = page.getViewport({ scale });
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('pdfjs: 2D canvas context unavailable');
  }
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // pdfjs-dist v5 typings require `canvas` in the render params.
  await page.render({
    canvasContext: ctx,
    viewport,
    canvas,
  } as Parameters<typeof page.render>[0]).promise;
  return { width: viewport.width, height: viewport.height };
}
