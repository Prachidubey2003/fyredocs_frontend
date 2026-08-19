/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Pass "" so loadEnv returns ALL vars, not just VITE_-prefixed ones.
  // API_PROXY_TARGET is read only by the dev server (Node side) and is never
  // shipped into the client bundle, so it deliberately omits the VITE_ prefix.
  //
  // Precedence: shell/CI env > .env files > built-in default. loadEnv only
  // reads .env files, so we check process.env first to honour shell-exported
  // vars like `API_PROXY_TARGET=... npm run dev` and CI-injected vars.
  //
  // The default is the Caddy edge (http://localhost), not the gateway port:
  // Caddy is what routes /grafana and /uploads, so pointing straight at
  // http://localhost:8080 would break those two.
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget =
    process.env.API_PROXY_TARGET || env.API_PROXY_TARGET || "http://localhost";

  return {
    server: {
      host: "::",
      port: 5173,
      // Dev-server proxy to the Caddy edge, which fronts the api-gateway and
      // routes object bytes to MinIO. The production build is served by Caddy
      // itself, so these only matter for `npm run dev`.
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/auth": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/admin/metrics": {
          target: proxyTarget,
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
          target: proxyTarget,
          changeOrigin: true,
        },
        // Presigned multipart upload PUTs (the Caddy edge routes these to MinIO).
        "/uploads": {
          target: proxyTarget,
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
  };
});
