import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const apiPort = process.env["POKEDEX_UI_API_PORT"] ?? "8002";
const webPort = process.env["POKEDEX_UI_WEB_PORT"] ?? "4174";
const tags = process.env["POKEDEX_UI_TAGS"];

const testDir = defineBddConfig({
  features: "../specs/ui/*.feature",
  featuresRoot: "../specs/ui",
  steps: ["e2e/fixtures.ts", "e2e/steps/*.ts"],
  outputDir: ".features-gen",
  missingSteps: "fail-on-gen",
  ...(tags === undefined ? {} : { tags }),
});

export default defineConfig({
  testDir,
  timeout: 20_000,
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://127.0.0.1:${webPort}`,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "uv run --quiet serve",
      cwd: "../backend",
      env: { POKEDEX_PORT: apiPort },
      url: `http://127.0.0.1:${apiPort}/api/health`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `pnpm exec vite preview --port ${webPort}`,
      env: { POKEDEX_API_URL: `http://127.0.0.1:${apiPort}` },
      url: `http://127.0.0.1:${webPort}`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
