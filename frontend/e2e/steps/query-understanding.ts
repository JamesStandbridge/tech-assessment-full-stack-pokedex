import { expect, type Locator, type Page } from "@playwright/test";

import { Then, When } from "../fixtures";

const PAUSE_MS = 800;
const KEYSTROKE_MS = 40;

When("I type {string} and pause", async ({ page, pokedex }, text: string) => {
  await pokedex.searchBox().pressSequentially(text);
  await page.waitForTimeout(PAUSE_MS);
});

When(
  "I type {string} one character at a time and pause",
  async ({ page, pokedex }, text: string) => {
    await pokedex.searchBox().pressSequentially(text, { delay: KEYSTROKE_MS });
    await page.waitForTimeout(PAUSE_MS);
  },
);

When("I apply the refinement {string}", async ({ page }, label: string) => {
  await page.getByRole("button", { name: label, exact: true }).click();
});

When("I reload the page", async ({ page }) => {
  await page.reload();
});

When("I go back", async ({ page }) => {
  await page.goBack();
});

When(
  "I choose the suggestion {string} with the keyboard",
  async ({ page, pokedex }, label: string) => {
    await expect(page.getByRole("option", { name: label })).toBeVisible();
    await pokedex.searchBox().press("ArrowDown");
    await pokedex.searchBox().press("Enter");
  },
);

function termItems(page: Page, term: string): Locator {
  return page
    .getByRole("list", { name: "How the query was understood" })
    .getByRole("listitem")
    .filter({ hasText: term });
}

Then(
  "I see the term {string} understood as {string}",
  async ({ page }, term: string, role: string) => {
    await expect(termItems(page, term)).toContainText(role);
  },
);

Then("I see the term {string} shown as ignored", async ({ page }, term: string) => {
  await expect(termItems(page, term)).toContainText("ignored");
});

Then("the page URL holds the query {string}", async ({ page }, query: string) => {
  await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe(query);
});

Then("I see the suggestion {string}", async ({ page }, label: string) => {
  await expect(page.getByRole("option", { name: label })).toBeVisible();
});

Then("I see the reading {string}", async ({ page }, reading: string) => {
  await expect(page.getByRole("list", { name: "Readings" })).toContainText(reading);
});

Then("I see the notice {string}", async ({ page }, notice: string) => {
  await expect(page.getByText(notice, { exact: true })).toBeVisible();
});

Then("the search API received exactly one search", ({ pokedex }) => {
  expect(pokedex.searches).toHaveLength(1);
});
