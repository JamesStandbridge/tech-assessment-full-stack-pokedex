import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

import { test } from "../fixtures";

const { After } = createBdd(test);

/** Every scenario also checks that the Content Security Policy blocked nothing. */
After(async ({ page }) => {
  const violations = await page.evaluate(() =>
    String(Reflect.get(window, "__pokedexViolations") ?? ""),
  );
  expect(violations).toBe("");
});
