import optimizeLocales from "@react-aria/optimize-locales-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const apiTarget = process.env["POKEDEX_API_URL"] ?? "http://127.0.0.1:8000";
const proxy = { "/api": { target: apiTarget, changeOrigin: false } };
const ARTWORK_HOST = "https://raw.githubusercontent.com";
/** The one stylesheet React Aria's usePress injects: touch-action on pressable elements. */
const REACT_ARIA_PRESSABLE_STYLE = "'sha256-38RhXrc7EdReTKsOm23ZPOCUgniTUUcjky8QOOrQx6o='";

/** Scripts, styles and requests stay on the origin; images may also come from the artwork host. */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  `style-src 'self' ${REACT_ARIA_PRESSABLE_STYLE}`,
  `img-src 'self' ${ARTWORK_HOST} data:`,
  "connect-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = {
  "Content-Security-Policy": `${CONTENT_SECURITY_POLICY}; frame-ancestors 'none'`,
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

/** The policy is also a meta tag of the build, for static hosts that set no headers. */
function contentSecurityPolicy(): Plugin {
  return {
    name: "content-security-policy",
    apply: "build",
    transformIndexHtml: () => [
      {
        tag: "meta",
        attrs: { "http-equiv": "Content-Security-Policy", content: CONTENT_SECURITY_POLICY },
        injectTo: "head-prepend",
      },
    ],
  };
}

/** Fonts of the first screen, preloaded so text does not wait for the stylesheet. */
const PRELOADED_FONTS = [
  /im-fell-english-latin-400-normal.*\.woff2$/,
  /source-serif-4-latin-opsz-normal.*\.woff2$/,
];

function preloadFonts(): Plugin {
  return {
    name: "preload-fonts",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler: (_html, context) =>
        Object.keys(context.bundle ?? {})
          .filter((file) => PRELOADED_FONTS.some((pattern) => pattern.test(file)))
          .map((file) => ({
            tag: "link",
            attrs: {
              rel: "preload",
              href: `/${file}`,
              as: "font",
              type: "font/woff2",
              crossorigin: "",
            },
            injectTo: "head" as const,
          })),
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    { ...optimizeLocales.vite({ locales: ["en-US"] }), enforce: "pre" },
    contentSecurityPolicy(),
    preloadFonts(),
  ],
  server: { host: "127.0.0.1", port: 5173, strictPort: true, proxy },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true, proxy, headers: SECURITY_HEADERS },
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
