import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    exclude: ["tests/**", "node_modules/**"], // Exclude Playwright E2E tests
    fileParallelism: false, // Run tests sequentially to avoid DB truncation collision
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@zexio/zms-core": path.resolve(__dirname, "../core/src/index.ts"),
    },
  },
});
