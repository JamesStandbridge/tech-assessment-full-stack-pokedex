import { expect, type Locator, type Page } from "@playwright/test";

import type { PokedexWorld } from "./world";

export interface Spot {
  readonly x: number;
  readonly y: number;
}

/** Where each star stood before the view moved, and how far apart the stars were before a zoom. */
interface Sighting {
  readonly spots: Map<string, Spot>;
  spread: number;
}

const sightings = new WeakMap<Page, Sighting>();

export function sightingOf(page: Page): Sighting {
  const known = sightings.get(page);
  if (known !== undefined) return known;
  const fresh: Sighting = { spots: new Map(), spread: 0 };
  sightings.set(page, fresh);
  return fresh;
}

/** The center of the star a label names, as the still map draws it. */
export async function spotOf(label: Locator): Promise<Spot> {
  await expect(label).toBeVisible();
  const node = await label.getAttribute("data-node");
  if (node === null) throw new Error("The label names no star");
  const star = label.page().locator(`figure svg [data-node="${node}"]`);
  const box = await star.boundingBox();
  if (box === null) throw new Error(`The star ${node} is not on screen`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

export const LABEL_TOLERANCE = 1;
/** Two readings of the stars this far apart match once the sky has settled into its frame. */
const SETTLE_MS = 400;

/** Every star with a label, read at once so that a reading is one instant of the sky. */
export async function spotsOf(page: Page): Promise<Map<string, Spot>> {
  const stars = await page.evaluate(() => {
    const named = new Set(
      [...document.querySelectorAll("figure button[data-node]")].map((label) =>
        label.getAttribute("data-node"),
      ),
    );
    return [...document.querySelectorAll("figure svg [data-node]")].flatMap((star) => {
      const node = star.getAttribute("data-node");
      if (node === null || !named.has(node)) return [];
      const box = star.getBoundingClientRect();
      return [{ node, x: box.x + box.width / 2, y: box.y + box.height / 2 }];
    });
  });
  return new Map(stars.map((star) => [star.node, { x: star.x, y: star.y }]));
}

/** A spot of the left half of the sky with no label, panel or bar over it, where a drag starts. */
export async function openSky(page: Page, pokedex: PokedexWorld): Promise<Spot> {
  const box = await pokedex.constellation().boundingBox();
  if (box === null) throw new Error("The constellation is not on screen");
  const spot = await page.evaluate((area) => {
    for (let row = 2; row < 7; row += 1) {
      for (let column = 1; column < 4; column += 1) {
        const x = area.x + (area.width * column) / 8;
        const y = area.y + (area.height * row) / 8;
        const hit = document.elementFromPoint(x, y);
        if (hit?.closest("figure") !== null && hit?.closest("button") === null) return { x, y };
      }
    }
    return null;
  }, box);
  if (spot === null) throw new Error("The sky has no open spot to drag from");
  return spot;
}

/**
 * Where the stars stand once nothing moves them any more: the requests are
 * done, the app bar keeps its height, and two readings apart agree.
 */
export async function settledSpots(page: Page): Promise<Map<string, Spot>> {
  await page.waitForLoadState("networkidle");
  const barBottom = async (): Promise<number> =>
    (await page.locator("header").first().boundingBox())?.height ?? 0;
  let settled = new Map<string, Spot>();
  await expect(async () => {
    const bar = await barBottom();
    const before = await spotsOf(page);
    await page.waitForTimeout(SETTLE_MS);
    expect(await barBottom()).toBe(bar);
    expect(await spotsOf(page)).toEqual(before);
    settled = before;
  }).toPass();
  return settled;
}
