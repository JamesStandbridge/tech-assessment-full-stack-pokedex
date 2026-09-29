/**
 * Lighthouse CI budgets of ADR 11, measured on the production preview with the
 * default mobile emulation and throttling. The preview proxies /api to the API
 * that scripts/with-api.sh starts.
 */
const PORT = 4175;
const ORIGIN = `http://127.0.0.1:${String(PORT)}`;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `pnpm exec vite preview --port ${String(PORT)}`,
      startServerReadyPattern: "127.0.0.1",
      url: [`${ORIGIN}/`, `${ORIGIN}/?q=rain+team`],
      numberOfRuns: 1,
      settings: { chromeFlags: "--headless=new --no-sandbox" },
    },
    assert: {
      assertions: {
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["error", { maxNumericValue: 200 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
