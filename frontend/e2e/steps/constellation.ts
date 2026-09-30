import { expect } from "@playwright/test";

import { Then, When } from "../fixtures";
import { nodeLabel } from "../world";

Then("the constellation shows {int} species", async ({ pokedex }, count: number) => {
  await expect(pokedex.constellation()).toHaveAttribute("data-species", String(count));
});

Then("the constellation is a still map", async ({ pokedex }) => {
  await expect(pokedex.constellation()).toHaveAttribute("data-renderer", "still");
});

Then("the constellation brings {string} to the front", async ({ pokedex }, text: string) => {
  await expect(pokedex.constellation()).toHaveAttribute("data-layout", "focus");
  await expect(pokedex.star(text)).toHaveAttribute("data-emphasis", "front");
});

Then(
  "the constellation aligns the results on the {string} axis",
  async ({ pokedex }, stat: string) => {
    await expect(pokedex.constellation()).toHaveAttribute("data-layout", "axis");
    await expect(pokedex.constellation()).toHaveAttribute("data-axis", stat);
  },
);

Then("the constellation places {string} first on that axis", async ({ pokedex }, text: string) => {
  await expect(pokedex.star(text)).toHaveAttribute("data-rank", "1");
});

Then(
  "the constellation places {string} in the ring of {string}",
  async ({ pokedex }, text: string, ring: string) => {
    await expect(pokedex.constellation()).toHaveAttribute("data-layout", "rings");
    await expect(pokedex.star(text)).toHaveAttribute("data-ring", ring);
  },
);

Then("the constellation links {string} to {string}", async ({ page }, from: string, to: string) => {
  const relations = page.getByRole("list", { name: "Relations" });
  await expect(relations).toContainText(`${nodeLabel(from)} → ${nodeLabel(to)}`);
});

Then(
  "the constellation gathers the carriers of {string} around it",
  async ({ page, pokedex }, text: string) => {
    await expect(pokedex.constellation()).toHaveAttribute("data-layout", "hubs");
    const relations = page.getByRole("list", { name: "Relations" }).getByRole("listitem");
    await expect(relations.filter({ hasText: `${nodeLabel(text)} → ` }).first()).toBeAttached();
  },
);

When("I focus {string} in the constellation", async ({ pokedex }, text: string) => {
  await pokedex.star(text).focus();
});

Then(
  "the constellation highlights {string} and {string}",
  async ({ pokedex }, first: string, second: string) => {
    for (const text of [first, second]) {
      await expect(pokedex.star(text)).toHaveAttribute("data-highlighted", "true");
    }
  },
);

When("I select {string} in the constellation", async ({ page, pokedex }, text: string) => {
  await pokedex.star(text).focus();
  await page.keyboard.press("Enter");
});
