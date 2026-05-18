/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/admin/metrics": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Production-build tuning. Dev config is unchanged — this
  // only applies to `vite build`. Goals:
  //   1. Cache-friendly chunks. Vendor libraries are split
  //      out so a deploy that only touches app code doesn't
  //      bust the user's cached React / Radix / pdf.js
  //      bytes.
  //   2. Lazy-loaded editor. pdf.js + pdf-lib + the
  //      editor-only modules live in their own chunks so
  //      the marketing / docs pages don't pay for them.
  //   3. Predictable budget. The chunkSizeWarningLimit is
  //      tuned above the largest legitimate chunk
  //      (mermaid-vendor ≈ 2.5MB, route-lazy on /docs).
  //      Anything bigger surfaces as a build warning; CI is
  //      gated separately by scripts/check-bundle-size.mjs.
  build: {
    chunkSizeWarningLimit: 3000,
    sourcemap: true, // upload to Sentry post-build; not served publicly
    rollupOptions: {
      output: {
        manualChunks(id: string): string | undefined {
          // We only split node_modules — local source stays
          // route-lazy via React.lazy in the app. Anything
          // outside node_modules falls through to the
          // default chunker.
          if (!id.includes("node_modules")) {
            return undefined;
          }

          // PDF rendering — the heaviest single dep (~700KB
          // post-gzip). Editor pages pull this; everyone
          // else doesn't.
          if (id.includes("/pdfjs-dist/") || id.includes("/pdf-lib/")) {
            return "pdf-vendor";
          }

          // Mermaid is large (≈2MB) and only the /docs and
          // /architecture pages render diagrams. Its own
          // chunk so the cache stays stable when app code
          // changes. Shiki is deliberately NOT bundled here
          // — its per-language grammars are already lazy
          // dynamic imports via `await codeToHtml({lang})`,
          // and grouping them would force every grammar to
          // download for any docs page.
          if (id.includes("/mermaid/")) {
            return "mermaid-vendor";
          }

          // Recharts is only the analytics + admin
          // dashboard pages.
          if (id.includes("/recharts/") || id.includes("/d3-")) {
            return "charts-vendor";
          }

          // Radix UI — 25+ small packages, all part of the
          // shared design system. Group so the user
          // downloads one cache-stable chunk rather than
          // 25 separate fetches.
          if (id.includes("/@radix-ui/")) {
            return "radix-vendor";
          }

          // The React + routing + query trio is on every
          // page; keep it one chunk so it stays cached
          // across deploys.
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/react-router-dom/") ||
            id.includes("/scheduler/") ||
            id.includes("/@tanstack/")
          ) {
            return "react-vendor";
          }

          // Animation library — used across many pages but
          // not always. Its own chunk keeps it cached when
          // the user navigates between animated views.
          if (id.includes("/framer-motion/")) {
            return "motion-vendor";
          }

          // Everything else in node_modules lands in the
          // default vendor chunk. Don't enumerate every
          // small dep — the long tail isn't worth the
          // per-chunk request overhead.
          return undefined;
        },
      },
    },
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
  },
});
