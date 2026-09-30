import { expect } from "@playwright/test";

import { THEME_INKS } from "../../src/features/theme/boot";
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
      const bars = [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')];
      const bar = [...new Set(bars.map((meta) => meta.content))].join(" ");
      Object.assign(window, { __pokedexFirstTheme: first, __pokedexFirstBar: bar });
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
    const first = await page.evaluate(() => ({
      theme: String(Reflect.get(window, "__pokedexFirstTheme")),
      bar: String(Reflect.get(window, "__pokedexFirstBar")),
    }));
    expect(first).toEqual({ theme, bar: THEME_INKS[theme] });
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  },
);
