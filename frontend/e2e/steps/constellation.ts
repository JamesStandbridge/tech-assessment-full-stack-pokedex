import { expect, type Locator, type Page } from "@playwright/test";

import { Then, When } from "../fixtures";
import { nodeLabel, type PokedexWorld } from "../world";

interface Spot {
  readonly x: number;
  readonly y: number;
}

/** Where each star stood before the view moved, and how far apart the stars were before a zoom. */
interface Sighting {
  readonly spots: Map<string, Spot>;
  spread: number;
}

const sightings = new WeakMap<Page, Sighting>();

function sightingOf(page: Page): Sighting {
  const known = sightings.get(page);
  if (known !== undefined) return known;
  const fresh: Sighting = { spots: new Map(), spread: 0 };
  sightings.set(page, fresh);
  return fresh;
}

/** The label of a star sits under it; the star itself is just above the label. */
async function spotOf(label: Locator): Promise<Spot> {
  await expect(label).toBeVisible();
  const box = await label.boundingBox();
  if (box === null) throw new Error("The star has no label on screen");
  return { x: box.x + box.width / 2, y: box.y - 8 };
}

const LABEL_TOLERANCE = 1;

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
  await expect(pokedex.star(text)).toBeVisible();
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
  await expect(pokedex.star(text)).toBeVisible();
  await pokedex.star(text).focus();
  await page.keyboard.press("Enter");
});

When(
  "I drag the constellation by {int} and {int} pixels",
  async ({ page, pokedex }, dx: number, dy: number) => {
    const sighting = sightingOf(page);
    await expect(pokedex.star("ability:swift-swim")).toBeVisible();
    for (const label of await pokedex.constellation().locator("button[data-node]").all()) {
      const node = await label.getAttribute("data-node");
      if (node !== null) sighting.spots.set(node, await spotOf(label));
    }
    const box = await pokedex.constellation().boundingBox();
    if (box === null) throw new Error("The constellation is not on screen");
    const start = { x: box.x + box.width / 3, y: box.y + box.height / 2 };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + dx, start.y + dy, { steps: 10 });
    await page.mouse.up();
  },
);

async function expectShift(page: Page, pokedex: PokedexWorld, shift: Spot): Promise<void> {
  const spots = sightingOf(page).spots;
  expect(spots.size).toBeGreaterThan(0);
  await expect(async () => {
    for (const [node, before] of spots) {
      const after = await spotOf(pokedex.star(node));
      expect(Math.abs(after.x - before.x - shift.x)).toBeLessThanOrEqual(LABEL_TOLERANCE);
      expect(Math.abs(after.y - before.y - shift.y)).toBeLessThanOrEqual(LABEL_TOLERANCE);
    }
  }).toPass();
}

Then(
  "the stars have moved by {int} and {int} pixels",
  async ({ page, pokedex }, x: number, y: number) => {
    await expectShift(page, pokedex, { x, y });
  },
);

async function spreadOf(pokedex: PokedexWorld): Promise<number> {
  const first = await spotOf(pokedex.star("ability:swift-swim"));
  const second = await spotOf(pokedex.star("pokemon:goldeen"));
  return Math.hypot(first.x - second.x, first.y - second.y);
}

When("I zoom into the constellation at {string}", async ({ page, pokedex }, text: string) => {
  sightingOf(page).spread = await spreadOf(pokedex);
  const spot = await spotOf(pokedex.star(text));
  await page.mouse.move(spot.x, spot.y);
  await page.mouse.wheel(0, -400);
});

Then("the stars of the constellation spread apart", async ({ page, pokedex }) => {
  const before = sightingOf(page).spread;
  await expect.poll(() => spreadOf(pokedex)).toBeGreaterThan(before * 1.2);
});

When("I recenter the constellation", async ({ pokedex }) => {
  await pokedex.constellation().getByRole("button", { name: "Recenter" }).click();
});

Then("the stars are back in place", async ({ page, pokedex }) => {
  await expectShift(page, pokedex, { x: 0, y: 0 });
  await expect(pokedex.constellation().getByRole("button", { name: "Recenter" })).toHaveCount(0);
});

When("I point at {string} in the constellation", async ({ page, pokedex }, text: string) => {
  const spot = await spotOf(pokedex.star(text));
  await page.mouse.move(spot.x, spot.y);
});

When("I click {string} in the constellation", async ({ page, pokedex }, text: string) => {
  const spot = await spotOf(pokedex.star(text));
  await page.mouse.click(spot.x, spot.y);
});
