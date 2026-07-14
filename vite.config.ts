/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 5173,
    // Dev-server proxy to the Caddy edge (http://localhost), which fronts
    // the api-gateway and routes object bytes to MinIO. The production
    // build is served by Caddy itself, so these only matter for `npm run dev`.
    proxy: {
      "/api": {
        target: "http://localhost",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://localhost",
        changeOrigin: true,
      },
      "/admin/metrics": {
        target: "http://localhost",
        changeOrigin: true,
      },
      // Embedded Grafana (observability profile). The edge @grafana route
      // forward_auths this before proxying to Grafana. Intentionally NO
      // `ws: true`: the only WebSocket is Grafana Live, which the kiosk overview
      // dashboard doesn't need. Proxying it made Vite's dev server spam the
      // console with unhandled EPIPE on every socket teardown (Vite attaches its
      // own error loggers, so a `configure` hook can't suppress them). Without
      // `ws`, Vite leaves the Live upgrade unproxied (it fails silently in the
      // browser) and panels load over HTTP as normal. Production (Caddy) proxies
      // the WS fine, so Live works there.
      "/grafana": {
        target: "http://localhost",
        changeOrigin: true,
      },
      // Presigned multipart upload PUTs (the Caddy edge routes these to MinIO).
      "/uploads": {
        target: "http://localhost",
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
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
  },
});
