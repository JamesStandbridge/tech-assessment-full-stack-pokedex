import { expect, type Locator, type Page } from "@playwright/test";

import { Then, When } from "../fixtures";
import { nodeLabel, parseRef, type PokedexWorld } from "../world";

const MAX_PAGES = 5;

function quoted(list: string): readonly string[] {
  return [...list.matchAll(/"([^"]+)"/g)].flatMap(([, text]) => (text === undefined ? [] : [text]));
}

/** A button of a result, showing more results first when it is not on the pages shown yet. */
async function resultButton(page: Page, name: string): Promise<Locator> {
  const button = page.getByRole("button", { name, exact: true });
  const more = page.getByRole("button", { name: "Show more Pokémon" });
  const articles = page.getByRole("region", { name: "Pokémon", exact: true }).getByRole("article");
  await expect(articles.first()).toBeVisible();
  for (let loaded = 0; loaded < MAX_PAGES && !(await button.isVisible()); loaded += 1) {
    const shown = await articles.count();
    await more.click();
    await expect.poll(() => articles.count()).toBeGreaterThan(shown);
  }
  return button;
}

async function addToParty(page: Page, text: string): Promise<void> {
  await (await resultButton(page, `Add ${nodeLabel(text)} to the party`)).click();
}

function member(pokedex: PokedexWorld, text: string): Locator {
  return pokedex.party().locator(`[data-member="${parseRef(text).name}"]`);
}

/** Shortcuts act outside text fields, as after a click on the page. */
async function leaveTextFields(page: Page): Promise<void> {
  await page.evaluate(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.closest("input, textarea, select") !== null) {
      active.blur();
    }
  });
}

When(/^I (?:try to )?add (.+) to the party$/, async ({ page }, list: string) => {
  for (const text of quoted(list)) await addToParty(page, text);
});

When("I remove {string} from the party", async ({ pokedex }, text: string) => {
  await pokedex
    .party()
    .getByRole("button", { name: `Remove ${nodeLabel(text)}` })
    .click();
});

When("I clear the party", async ({ pokedex }) => {
  await pokedex.party().getByRole("button", { name: "Clear the party" }).click();
});

Then(/^the party holds (\d+) Pokémon$/, async ({ pokedex }, count: string) => {
  await expect(pokedex.party().locator("[data-member]")).toHaveCount(Number(count));
});

Then(/^the party holds ((?:"[^"]+"(?:, | and )?)+)$/, async ({ pokedex }, list: string) => {
  for (const text of quoted(list)) await expect(member(pokedex, text)).toBeVisible();
});

Then("the party does not hold {string}", async ({ pokedex }, text: string) => {
  await expect(member(pokedex, text)).toHaveCount(0);
});

Then("the party shows that they share {string}", async ({ pokedex }, weather: string) => {
  await expect(pokedex.party()).toContainText(new RegExp(`help with .*${weather}`, "i"));
});

Then("the party announces {string} with an undo action", async ({ page }, text: string) => {
  const status = page.getByRole("status", { name: "Workbench changes" });
  await expect(status).toContainText(text);
  await expect(status.getByRole("button", { name: "Undo" })).toBeVisible();
});

When("I undo from the announcement", async ({ page }) => {
  const status = page.getByRole("status", { name: "Workbench changes" });
  await status.getByRole("button", { name: "Undo" }).click();
});

When("I press the undo shortcut", async ({ page }) => {
  await leaveTextFields(page);
  await page.keyboard.press("ControlOrMeta+z");
});

When("I press the redo shortcut", async ({ page }) => {
  await leaveTextFields(page);
  await page.keyboard.press("ControlOrMeta+Shift+z");
});

When("I press the undo shortcut in the search box", async ({ page, pokedex }) => {
  await pokedex.searchBox().focus();
  await page.keyboard.press("ControlOrMeta+z");
});

When("I compare {string}", async ({ page }, text: string) => {
  await (await resultButton(page, `Compare ${nodeLabel(text)} on the bench`)).click();
});

Then(/^the bench compares ((?:"[^"]+"(?:, | and )?)+)$/, async ({ pokedex }, list: string) => {
  for (const text of quoted(list)) {
    await expect(
      pokedex.bench().locator(`th[data-contender="${parseRef(text).name}"]`),
    ).toBeVisible();
  }
});

function cell(pokedex: PokedexWorld, text: string, stat: string): Locator {
  const row = pokedex
    .bench()
    .getByRole("row")
    .filter({
      has: pokedex.page.getByRole("rowheader", { name: stat, exact: true }),
    });
  return row.locator(`td[data-contender="${parseRef(text).name}"]`);
}

Then(
  "the bench names {string} the leader of {string}",
  async ({ pokedex }, text: string, stat: string) => {
    await expect(cell(pokedex, text, stat)).toHaveAttribute("data-leader", "true");
  },
);

When("I pin {string} as the reference", async ({ pokedex }, text: string) => {
  const name = `Pin ${nodeLabel(text)} as the reference`;
  await pokedex.bench().getByRole("button", { name }).click();
});

Then(/^the bench shows ("[^"]+" at "[^"]+" on "[^"]+")$/, async ({ pokedex }, values: string) => {
  const [text = "", difference = "", stat = ""] = quoted(values);
  await expect(cell(pokedex, text, stat)).toContainText(`(${difference})`);
});

Then(
  "I am asked whom {string} replaces, with what each replacement gains and loses",
  async ({ page }, text: string) => {
    const prompt = page.getByRole("group", { name: `Replace whom with ${nodeLabel(text)}?` });
    await expect(prompt.getByRole("listitem")).toHaveCount(6);
    await expect(prompt).toContainText("gains");
    await expect(prompt).toContainText("loses");
  },
);

When("I replace {string} with {string}", async ({ page }, member: string, newcomer: string) => {
  const name = `Replace ${nodeLabel(member)} with ${nodeLabel(newcomer)}`;
  await page.getByRole("button", { name }).click();
});

When("another visitor opens the address of the page", async ({ page }) => {
  await expect.poll(() => new URL(page.url()).searchParams.get("party")).not.toBeNull();
  const address = page.url();
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.goto(address);
});

When("I reload the page without its address", async ({ page }) => {
  await page.goto("/");
});

When("I press {string}", async ({ page }, key: string) => {
  await leaveTextFields(page);
  await page.keyboard.press(key);
});

Then("the result {string} has the focus", async ({ page }, text: string) => {
  await expect(page.locator(`[data-result="${text}"]`)).toBeFocused();
});

Then("the keyboard shortcuts are listed", async ({ page }) => {
  await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();
});

Then("the search box has the focus", async ({ pokedex }) => {
  await expect(pokedex.searchBox()).toBeFocused();
});
