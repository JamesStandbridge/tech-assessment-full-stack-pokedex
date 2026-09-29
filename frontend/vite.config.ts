import optimizeLocales from "@react-aria/optimize-locales-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const apiTarget = process.env["POKEDEX_API_URL"] ?? "http://127.0.0.1:8000";
const proxy = { "/api": { target: apiTarget, changeOrigin: false } };

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    { ...optimizeLocales.vite({ locales: ["en-US"] }), enforce: "pre" },
  ],
  server: { host: "127.0.0.1", port: 5173, strictPort: true, proxy },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true, proxy },
  build: { target: "es2023", sourcemap: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/test/**", "src/api/schema.gen.ts", "src/main.tsx"],
      thresholds: {
        "src/domain/**": { branches: 90, functions: 90, lines: 90, statements: 90 },
        "src/api/**": { branches: 90, functions: 90, lines: 90, statements: 90 },
      },
    },
  },
});
