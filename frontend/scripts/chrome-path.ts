/** Print the Chromium that Playwright installed, so Lighthouse does not depend on a system browser. */
import { chromium } from "@playwright/test";

process.stdout.write(chromium.executablePath());
