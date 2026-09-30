import { expect } from "@playwright/test";

import { Then, When } from "../fixtures";

const LABELS = { system: "System", animated: "Animated", still: "Still" } as const;

type MotionName = keyof typeof LABELS;
type Drawing = "full" | "reduced";

function motionOf(word: string): MotionName {
  if (word === "system" || word === "animated" || word === "still") return word;
  throw new Error(`Not a motion preference: ${word}`);
}

function drawingOf(word: string): Drawing {
  if (word === "full" || word === "reduced") return word;
  throw new Error(`Not a motion drawing: ${word}`);
}

When("I choose {word} motion", async ({ page }, word: string) => {
  const motion = page.getByRole("radiogroup", { name: "Motion" });
  await motion.getByRole("radio", { name: LABELS[motionOf(word)] }).click();
});

Then("motion on the page is {word}", async ({ page }, word: string) => {
  await expect(page.locator("html")).toHaveAttribute("data-motion", drawingOf(word));
});

Then("the constellation is drawn with motion", async ({ page, pokedex }) => {
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
  await expect(pokedex.constellation()).toHaveAttribute("data-renderer", "scene");
});
