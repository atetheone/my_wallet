import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// wa-sqlite ships a .wasm asset and uses top-level await; exclude from pre-bundling.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Xaalis",
        short_name: "Xaalis",
        description: "Suivi des dépenses et épargne — Xaalis",
        lang: "fr",
        dir: "ltr",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0f1115",
        theme_color: "#0f1115",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,wasm}"],
        // SQLite wasm can exceed the default 2 MiB precache limit.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: "/index.html",
      },
      devOptions: { enabled: false },
    }),
  ],
  optimizeDeps: {
    exclude: ["wa-sqlite"],
  },
  build: {
    target: "es2022",
  },
});
