import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";

import { Given, Then, When } from "../fixtures";
import { parseRef } from "../world";

const MAX_TABS = 60;
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const FADE_PROPERTIES = new Set(["offset", "easing", "composite", "computedOffset", "opacity"]);

Given("I prefer reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

Given("a viewport {int} pixels wide", async ({ page }, width: number) => {
  await page.setViewportSize({ width, height: 800 });
});

When("I search for {string} using only the keyboard", async ({ page, pokedex }, query: string) => {
  for (let tabs = 0; tabs < MAX_TABS; tabs += 1) {
    if (await pokedex.searchBox().evaluate((node) => node === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(pokedex.searchBox()).toBeFocused();
  await page.keyboard.type(query);
  await page.keyboard.press("Enter");
});

When(
  "I open the result {string} using only the keyboard",
  async ({ page, pokedex }, text: string) => {
    const button = pokedex.openButton(parseRef(text));
    await expect(button).toBeVisible();
    for (let tabs = 0; tabs < MAX_TABS; tabs += 1) {
      if (await button.evaluate((node) => node === document.activeElement)) break;
      await page.keyboard.press("Tab");
    }
    await expect(button).toBeFocused();
    await page.keyboard.press("Enter");
  },
);

When("I press Escape", async ({ page }) => {
  await page.keyboard.press("Escape");
});

Then("the focus returns to the result {string}", async ({ pokedex }, text: string) => {
  await expect(pokedex.openButton(parseRef(text))).toBeFocused();
});

Then(
  /^the (comparison|relation graph) offers the same results as an accessible list$/,
  async ({ page, pokedex }, visual: string) => {
    if (visual === "comparison") {
      const section = pokedex.section("pokemon");
      await expect(section.getByRole("meter").first()).toBeVisible();
      const meters = await section.getByRole("meter").count();
      await expect(section.getByRole("article")).toHaveCount(meters);
      return;
    }
    const graph = page.getByRole("figure", { name: "Relation graph" });
    await expect(graph.locator("line").first()).toBeAttached();
    const links = await graph.locator("line").count();
    expect(links).toBeGreaterThan(0);
    await expect(page.getByRole("list", { name: "Relations" }).getByRole("listitem")).toHaveCount(
      links,
    );
  },
);

Then("nothing on the page moves beyond a fade", async ({ page, pokedex }) => {
  await expect(pokedex.resultsRegion().getByRole("article").first()).toBeVisible();
  const moving = await page.evaluate(
    (allowed) =>
      document.getAnimations().flatMap((animation) => {
        const effect = animation.effect;
        if (!(effect instanceof KeyframeEffect)) return [];
        const properties = effect.getKeyframes().flatMap((frame) => Object.keys(frame));
        return properties.filter((property) => !allowed.includes(property));
      }),
    [...FADE_PROPERTIES],
  );
  expect(moving).toEqual([]);
});

Then("no sound has played", async ({ page }) => {
  expect(await page.evaluate(() => Number(Reflect.get(window, "__pokedexSounds")))).toBe(0);
});

Then("the page has no accessibility violations", async ({ page }) => {
  await expect(page.getByRole("main")).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations.map((violation) => violation.id)).toEqual([]);
});

Then("the page does not scroll horizontally", async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
