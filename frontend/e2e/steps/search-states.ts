import { expect } from "@playwright/test";
import type { DataTable } from "playwright-bdd";

import { displayName } from "../../src/domain/entities";
import { Given, Then, When } from "../fixtures";
import { parseRef } from "../world";

const SLOW_RESPONSE_MS = 1500;
const ARTWORK_HOSTS = "https://raw.githubusercontent.com/**";

Given("I open the Pokédex", async ({ page }) => {
  await page.goto("/");
});

Given("the search API responds slowly", async ({ page }) => {
  await page.route("**/api/search**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, SLOW_RESPONSE_MS));
    await route.continue();
  });
});

Given("the search API is unreachable", async ({ page }) => {
  await page.route("**/api/search**", (route) => route.abort("connectionrefused"));
});

When("the search API is reachable again", async ({ page }) => {
  await page.unroute("**/api/search**");
});

Given("entity images cannot be loaded", async ({ page }) => {
  await page.route(ARTWORK_HOSTS, (route) => route.abort("connectionrefused"));
});

When("I search for {string}", async ({ pokedex }, query: string) => {
  await pokedex.search(query);
});

When("I select the example {string}", async ({ page }, query: string) => {
  await page.getByRole("button", { name: query, exact: true }).click();
});

When("I select the suggestion {string}", async ({ page }, label: string) => {
  await page.getByRole("button", { name: label, exact: true }).click();
});

When("I retry the search", async ({ page }) => {
  await page.getByRole("button", { name: "Retry" }).click();
});

When(
  /^I clear the search (with its control|with Escape outside the field|with Escape in the search box)$/,
  async ({ page, pokedex }, how: string) => {
    if (how === "with its control") {
      await page.getByRole("button", { name: "Clear search" }).click();
      return;
    }
    if (how === "with Escape in the search box") await pokedex.searchBox().focus();
    else {
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      });
    }
    await page.keyboard.press("Escape");
  },
);

Then("the page URL holds no query", async ({ page }) => {
  await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBeNull();
});

Then("the constellation shows the whole sky", async ({ pokedex }) => {
  await expect(pokedex.constellation()).toHaveAttribute("data-layout", "atlas");
});

Then("I see an example for each kind of question:", async ({ page }, table: DataTable) => {
  const examples = page.getByRole("list", { name: "Examples" });
  for (const row of table.hashes()) {
    const example = examples.getByRole("button", { name: row["query"] ?? "", exact: true });
    await expect(example).toBeVisible();
    await expect(example).toHaveAccessibleDescription(row["question"] ?? "");
  }
});

Then("the search box contains {string}", async ({ pokedex }, query: string) => {
  await expect(pokedex.searchBox()).toHaveValue(query);
});

Then("I see results", async ({ pokedex }) => {
  await expect(pokedex.resultsRegion().getByRole("article").first()).toBeVisible();
});

Then("I eventually see results", async ({ pokedex }) => {
  await expect(pokedex.resultsRegion().getByRole("article").first()).toBeVisible({
    timeout: 10_000,
  });
});

Then("I see a loading state", async ({ page }) => {
  await expect(page.getByRole("status").filter({ hasText: "Searching" })).toBeVisible();
});

Then("I see the message for an empty outcome", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "No match in the Pokédex" })).toBeVisible();
});

Then("I see the message for an invalid query", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "This query cannot be searched" })).toBeVisible();
});

Then("I see the message for a failed request", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "The search failed" })).toBeVisible();
});

Then("I see the explanation {string}", async ({ page }, explanation: string) => {
  await expect(page.getByText(explanation, { exact: true })).toBeVisible();
});

Then("the result {string} shows an image placeholder", async ({ pokedex }, text: string) => {
  const ref = parseRef(text);
  const placeholder = pokedex
    .result(ref)
    .getByRole("img", { name: `${displayName(ref.name)} (image unavailable)` });
  await expect(placeholder).toBeVisible();
});

Then("I can open the result {string}", async ({ pokedex }, text: string) => {
  const ref = parseRef(text);
  await pokedex.openButton(ref).click();
  await expect(pokedex.details(ref)).toBeVisible();
});
