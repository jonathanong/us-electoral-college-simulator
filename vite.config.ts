import { preact } from "@preact/preset-vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/us-electoral-college-simulator/",
  plugins: [preact({ prerender: { enabled: true, renderTarget: "#app" } })],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx"],
      reporter: ["text", "lcov"],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
