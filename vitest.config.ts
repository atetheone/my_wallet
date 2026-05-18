import { defineConfig } from "vitest/config";

// Separate from vite.config.ts so the PWA plugin / wa-sqlite wasm
// never load in the node test environment. Pure logic libs only.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/lib/**/*.test.ts"],
  },
});
