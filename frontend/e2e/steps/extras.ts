import { expect } from "@playwright/test";

import { displayName } from "../../src/domain/entities";
import { Given, Then, When } from "../fixtures";
import { nodeLabel, parseRef } from "../world";

interface Entry {
  readonly genus: string | null;
  readonly description: string | null;
}

function isEntry(value: unknown): value is Entry {
  return typeof value === "object" && value !== null && "genus" in value && "description" in value;
}

Then(
  "the best match {string} shows its artwork, genus and description",
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
      await page.getByRole("checkbox", { name: `Overlay ${nodeLabel(text)}` }).check();
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
