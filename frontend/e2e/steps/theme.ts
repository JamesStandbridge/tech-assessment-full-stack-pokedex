import { expect } from "@playwright/test";

import { Given, Then, When } from "../fixtures";

const THEMES = { light: "Light", dark: "Dark" } as const;

function themeOf(word: string): keyof typeof THEMES {
  if (word === "light" || word === "dark") return word;
  throw new Error(`Not a theme: ${word}`);
}

Given("I prefer a {word} color scheme", async ({ page }, word: string) => {
  await page.emulateMedia({ colorScheme: themeOf(word) });
  await page.addInitScript(() => {
    document.addEventListener("readystatechange", () => {
      if (document.readyState !== "interactive") return;
      const first = document.documentElement.dataset["theme"] ?? "";
      Object.assign(window, { __pokedexFirstTheme: first });
    });
  });
});

When("I choose the {word} theme", async ({ page }, word: string) => {
  const themes = page.getByRole("radiogroup", { name: "Theme" });
  await themes.getByRole("radio", { name: THEMES[themeOf(word)] }).click();
});

Then("the page is drawn in the {word} theme", async ({ page }, word: string) => {
  const theme = themeOf(word);
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  await expect(page.locator("html")).toHaveCSS("color-scheme", theme);
});

Then(
  "the page is drawn in the {word} theme from its first paint",
  async ({ page }, word: string) => {
    const theme = themeOf(word);
    const first = await page.evaluate(() => String(Reflect.get(window, "__pokedexFirstTheme")));
    expect(first).toBe(theme);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  },
);
