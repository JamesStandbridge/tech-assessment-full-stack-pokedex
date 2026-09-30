import { expect, type Locator, type Page } from "@playwright/test";

import { Then, When } from "../fixtures";

function guide(page: Page): Locator {
  return page.getByRole("dialog", { name: "How to ask" });
}

When("I open the query guide", async ({ page }) => {
  await page.getByRole("button", { name: "How to ask", exact: true }).click();
});

When("I select the guide example {string}", async ({ page }, query: string) => {
  const examples = guide(page).getByRole("list", { name: /examples$/ });
  await examples.getByRole("button", { name: query, exact: true }).click();
});

When("I open the query guide from the empty outcome", async ({ page }) => {
  await page.getByRole("button", { name: /^How to ask about/ }).click();
});

When("I open the query guide from the shortcuts", async ({ page }) => {
  const shortcuts = page.getByRole("dialog", { name: "Keyboard shortcuts" });
  await shortcuts.getByRole("button", { name: "How to ask", exact: true }).click();
});

Then("I see the query guide", async ({ page }) => {
  await expect(guide(page)).toBeVisible();
});

Then("the query guide explains {string}", async ({ page }, title: string) => {
  await expect(guide(page).getByRole("heading", { name: title, exact: true })).toBeVisible();
});

Then("the query guide is closed", async ({ page }) => {
  await expect(guide(page)).toHaveCount(0);
});
