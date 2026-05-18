# PDF rendering strategy

**Current renderer:** Mozilla `pdfjs-dist` v5 (BSD/Apache-2.0).
**Where it lives:** [`src/components/editor/pdfjs.ts`](../src/components/editor/pdfjs.ts) — a thin facade so the rest of the editor module never imports pdf.js directly.
**Why a facade:** renderer swaps are isolated to that one file.

This document records the renderer-engine decision and the migration path to PDFium-WASM (called out in the product plan §5.3 for server/client pixel parity).

## Why not PDFium-WASM today

The plan's directive is "PDFium-WASM client + PDFium-via-cgo/FFI server → pixel parity end-to-end." Today we have neither side on PDFium:

- **Server-side:** Ghostscript (compression), Poppler (OCR + image extraction), LibreOffice (Office ↔ PDF). None of these are PDFium. The Rust incremental PDF writer (separate Phase 1 todo) hasn't landed.
- **Client-side:** pdf.js renders PDFs in the viewer. Battle-tested, Vite-friendly, BSD/Apache.

Swapping the client to PDFium-WASM **before** the server unifies on PDFium would create a different parity gap (PDFium client vs. Ghostscript server), not close one. The integration cost is also nontrivial — see "What a swap requires" below.

## Available PDFium-WASM packages (as of 2026-05-13)

| Package | Version | Maturity | Notes |
|---|---|---|---|
| `@embedpdf/pdfium` | 2.x | active | Raw Emscripten bindings around PDFium's C API. ~150 lines of glue needed to render a page to a canvas. WASM blob is ~5 MB. |
| `pdfium-wasm` | dated | low | Older, less maintained. |
| Custom Emscripten build of PDFium | — | full control | Several weeks of work; only worth it if we want to subset PDFium for bundle size. |

`@embedpdf/pdfium` is the realistic Phase 1 path **when we're ready**. It does NOT ship a `renderPageToCanvas` API — you have to write that.

## What a swap requires

1. Replace [`pdfjs.ts`](../src/components/editor/pdfjs.ts) implementations of `loadPdf` and `renderPage` with PDFium-backed equivalents.
2. Wire `init()` once per page load (deterministic WASM-blob URL via Vite's `?url`).
3. Implement the render loop: `EPDF_LoadDocument` → `EPDF_LoadPageNormalized` → render to RGBA buffer → blit to canvas honoring `devicePixelRatio`.
4. Match pdf.js's resource-management contract (`PDFDocumentProxy.destroy()`).
5. Add a golden-PDF corpus comparison (~50 reference PDFs, SSIM ≥ 0.98 between client + server renders) — this is the actual gate that proves pixel parity.
6. Performance benchmark: PDFium-WASM must hit the Phase 1 perf budget (10-page PDF open p95 ≤ 900ms per plan §4.8). Custom builds may be needed if the default 5 MB WASM blob inflates cold-load latency.

The component tree above `pdfjs.ts` does not change.

## Triggers to revisit

Migrate to PDFium-WASM when **all** of these are true:

1. Server-side rendering has converged on PDFium (Rust writer + cgo render path, or PDFium-Go bindings).
2. The Phase 1 golden-PDF corpus exists so the swap can be SSIM-gated in CI.
3. The 5 MB WASM cold-load is acceptable for the target user (likely fine on desktop; tested on the slowest target mobile network).
4. We have engineering capacity for ~1 week of integration + bug-fix work, given the renderer is exercised by 100% of editor traffic.

## Until then

- pdf.js stays. It works. The facade keeps the swap isolated when triggers fire.
- The component API in [`PdfViewer.tsx`](../src/components/editor/PdfViewer.tsx) / [`PdfPage.tsx`](../src/components/editor/PdfPage.tsx) does not depend on which engine renders.
- No PDFium-WASM dependency in `package.json` (it was investigated and uninstalled to keep the dependency surface clean).

## Related

- Product plan: see the project root plan §5.3 ("Parser & writer").
- Server-side path: the Rust incremental writer task in the Phase 1 todo list.
- Mobile path: PDFium-Android + PDFKit-iOS via JSI in `fyredocs_mobile` (Phase M.2 todo).
