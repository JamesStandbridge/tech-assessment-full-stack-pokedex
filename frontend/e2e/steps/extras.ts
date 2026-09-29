import { expect, type Page } from "@playwright/test";

import { displayName } from "../../src/domain/entities";
import { Given, Then, When } from "../fixtures";
import { parseRef } from "../world";

const MAX_PAGES = 5;

interface Entry {
  readonly genus: string | null;
  readonly description: string | null;
}

function isEntry(value: unknown): value is Entry {
  return typeof value === "object" && value !== null && "genus" in value && "description" in value;
}

function nodeLabel(text: string): string {
  return text.includes(":") ? displayName(parseRef(text).name) : displayName(text);
}

Then(
  "the best match {string} is a card with its artwork, genus and description",
  async ({ page }, text: string) => {
    const ref = parseRef(text);
    const response = await page.request.get(`/api/entities/${ref.kind}/${ref.name}`);
    const detail: unknown = await response.json();
    if (!isEntry(detail)) throw new Error(`${text} has no Pokédex entry.`);
    const card = page.getByRole("region", { name: "Best match" });
    await expect(card.getByRole("img", { name: displayName(ref.name) })).toBeVisible();
    await expect(card).toContainText(detail.genus ?? "");
    await expect(card).toContainText(detail.description ?? "");
  },
);

Then("the page ambience is {string}", async ({ page }, weather: string) => {
  await expect(page.locator("[data-ambience]")).toHaveAttribute("data-ambience", weather);
});

When(
  "I select {string} and {string} for comparison",
  async ({ page }, first: string, second: string) => {
    for (const text of [first, second]) {
      await page.getByRole("checkbox", { name: `Compare ${nodeLabel(text)}` }).check();
    }
  },
);

Then(
  "I see the stat profiles of {string} and {string} overlaid",
  async ({ page }, first: string, second: string) => {
    const name = `Stat profiles of ${nodeLabel(first)} and ${nodeLabel(second)}`;
    await expect(page.getByRole("img", { name })).toBeVisible();
  },
);

Then(
  "the relation graph links {string} to {string}",
  async ({ page }, from: string, to: string) => {
    const relations = page.getByRole("list", { name: "Relations" });
    await expect(relations).toContainText(`${nodeLabel(from)} → ${nodeLabel(to)}`);
  },
);

When("I select {string} in the relation graph", async ({ page }, text: string) => {
  const graph = page.getByRole("figure", { name: "Relation graph" });
  await graph.getByRole("button", { name: nodeLabel(text), exact: true }).click();
});

/** Add a Pokémon, showing more results first when it is not on the pages shown yet. */
async function addToTeam(page: Page, text: string): Promise<void> {
  const button = page.getByRole("button", { name: `Add ${nodeLabel(text)} to the team` });
  const more = page.getByRole("button", { name: "Show more Pokémon" });
  const articles = page.getByRole("region", { name: "Pokémon", exact: true }).getByRole("article");
  await expect(articles.first()).toBeVisible();
  for (let loaded = 0; loaded < MAX_PAGES && !(await button.isVisible()); loaded += 1) {
    const shown = await articles.count();
    await more.click();
    await expect.poll(() => articles.count()).toBeGreaterThan(shown);
  }
  await button.click();
}

When(/^I add (.+) to the team$/, async ({ page }, list: string) => {
  for (const [, text] of list.matchAll(/"([^"]+)"/g)) {
    await addToTeam(page, text ?? "");
  }
});

When("I try to add {string} to the team", async ({ page }, text: string) => {
  const button = page.getByRole("button", { name: `Add ${nodeLabel(text)} to the team` });
  if (await button.isEnabled()) await button.click();
});

Then(/^the team tray (?:still )?holds (\d+) Pokémon$/, async ({ page }, count: string) => {
  const tray = page.getByRole("region", { name: "Team" });
  await expect(tray.getByRole("listitem")).toHaveCount(Number(count));
});

Then("the team tray shows that they share {string}", async ({ page }, weather: string) => {
  await expect(page.getByRole("region", { name: "Team" })).toContainText(new RegExp(weather, "i"));
});

Given("the browser supports speech", async ({ page }) => {
  await page.addInitScript(() => {
    class FakeRecognition extends EventTarget {
      onresult: ((event: { results: { transcript: string }[][] }) => void) | null = null;
      start(): void {
        const transcript = String(Reflect.get(window, "__pokedexSpeech"));
        this.onresult?.({ results: [[{ transcript }]] });
      }
      stop(): void {
        this.onresult = null;
      }
    }
    Object.assign(window, { SpeechRecognition: FakeRecognition, __pokedexSpeech: "" });
  });
  await page.reload();
});

When("I speak {string}", async ({ page }, words: string) => {
  await page.evaluate((spoken) => Object.assign(window, { __pokedexSpeech: spoken }), words);
  await page.getByRole("button", { name: "Search by voice" }).click();
});

When("I ask to hear the entry of {string}", async ({ pokedex, page }, text: string) => {
  await pokedex.openButton(parseRef(text)).click();
  await page.getByRole("button", { name: "Read the entry aloud" }).click();
});

Then("the entry of {string} is read aloud", async ({ page }, text: string) => {
  await expect
    .poll(() => page.evaluate(() => String(Reflect.get(window, "__pokedexSpoken") ?? "")))
    .toContain(nodeLabel(text));
});
