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
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget =
    process.env.API_PROXY_TARGET ||
    env.API_PROXY_TARGET ||
    "http://localhost:8080";

  return {
    server: {
      host: "::",
      port: 5173,
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
