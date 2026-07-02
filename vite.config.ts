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
      // Presigned multipart upload PUTs (the Caddy edge routes these to MinIO).
      "/fyredocs-uploads": {
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
