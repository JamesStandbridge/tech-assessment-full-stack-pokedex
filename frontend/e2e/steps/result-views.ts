import { expect } from "@playwright/test";

import type { EntityKind } from "../../src/api/contract";
import { displayName, kindLabel } from "../../src/domain/entities";
import { STAT_LABELS } from "../../src/domain/stats";
import { Then, When } from "../fixtures";
import { parseRef } from "../world";

const ROLE_LABELS: Readonly<Record<string, string>> = {
  benefit: "Benefit",
  drawback: "Drawback",
  setter: "Setter",
};

function kindOf(text: string): EntityKind {
  return parseRef(`${text}:any`).kind;
}

Then(
  "the result {string} shows the reason {string}",
  async ({ pokedex }, text: string, reason: string) => {
    await expect(pokedex.result(parseRef(text))).toContainText(reason);
  },
);

Then("the reason of {string} links to {string}", async ({ pokedex }, text: string, to: string) => {
  const related = parseRef(to);
  const link = pokedex.result(parseRef(text)).getByRole("button", {
    name: displayName(related.name),
    exact: true,
  });
  await expect(link).toBeVisible();
});

Then(/^I see the (\w+) view$/, async ({ page }, reading: string) => {
  await expect(page.locator(`[data-reading="${reading}"]`)).toBeVisible();
});

Then(
  "every Pokémon result shows its {string} on a comparison bar",
  async ({ pokedex }, stat: string) => {
    const label = Object.entries(STAT_LABELS).find(([name]) => name === stat)?.[1] ?? stat;
    const articles = pokedex.section("pokemon").getByRole("article");
    await expect(articles.first()).toBeVisible();
    for (const article of await articles.all()) {
      await expect(article.getByRole("meter", { name: label })).toBeVisible();
    }
  },
);

Then(
  "the result {string} shows a chance of {string}",
  async ({ pokedex }, text: string, chance: string) => {
    await expect(pokedex.result(parseRef(text))).toContainText(chance);
  },
);

Then(
  /^the result "([^"]+)" is marked as a (benefit|drawback|setter)$/,
  async ({ pokedex }, text: string, role: string) => {
    await expect(pokedex.result(parseRef(text))).toContainText(ROLE_LABELS[role] ?? role);
  },
);

Then(
  /^the "(\w+)" section shows (\d+ of \d+) results$/,
  async ({ pokedex }, kind: string, count: string) => {
    const section = pokedex.section(kindOf(kind));
    await expect(section.getByRole("article")).toHaveCount(Number(count.split(" ")[0]));
    await expect(section).toContainText(count);
  },
);

When("I ask for more results in the {string} section", async ({ pokedex }, kind: string) => {
  const label = kindLabel(kindOf(kind), 2);
  await pokedex
    .section(kindOf(kind))
    .getByRole("button", { name: `Show more ${label}` })
    .click();
});

Then(
  "the first result of the {string} section is still {string}",
  async ({ pokedex }, kind: string, text: string) => {
    const first = pokedex.section(kindOf(kind)).getByRole("article").first();
    await expect(first).toHaveAccessibleName(displayName(parseRef(text).name));
  },
);

When("I open the result {string}", async ({ pokedex }, text: string) => {
  await pokedex.openButton(parseRef(text)).click();
});

Then("I see the details of {string}", async ({ pokedex }, text: string) => {
  await expect(pokedex.details(parseRef(text))).toBeVisible();
});

Then("the details list {string}", async ({ page }, text: string) => {
  const ref = parseRef(text);
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("button", { name: displayName(ref.name), exact: true }),
  ).toBeVisible();
});

When("I open the related {string}", async ({ page }, text: string) => {
  const ref = parseRef(text);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: displayName(ref.name), exact: true })
    .click();
});
