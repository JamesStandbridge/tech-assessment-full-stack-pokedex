import { createBdd, test as base } from "playwright-bdd";

import { PokedexWorld } from "./world";

export const test = base.extend<{ pokedex: PokedexWorld }>({
  pokedex: async ({ page }, provide) => {
    const world = new PokedexWorld(page);
    await world.install();
    await provide(world);
  },
});

export const { Given, When, Then } = createBdd(test);
