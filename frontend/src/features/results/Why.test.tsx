import { render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { pokemonNamed } from "../../test/find";
import { fastElectricSearch } from "../../test/recorded/fastElectricSearch";
import { sleepSearch } from "../../test/recorded/sleepSearch";
import { segments, Why } from "./Why";

test("the words of the query are cut out of a reason, whole words only", () => {
  expect(segments("Causes sleep, 100% chance", ["sleep", "sl"])).toEqual([
    { at: 0, text: "Causes ", emphasised: false },
    { at: 7, text: "sleep", emphasised: true },
    { at: 12, text: ", 100% chance", emphasised: false },
  ]);
  expect(segments("Sleeper", ["sleep"])).toEqual([{ at: 0, text: "Sleeper", emphasised: false }]);
});

test("a reason the badges or the metric already show is left out", () => {
  const { container } = render(
    <Why
      result={pokemonNamed(fastElectricSearch, "electrode")}
      covers={["stat-rank"]}
      emphasis={[]}
      onOpen={vi.fn()}
    />,
  );
  expect(container).toBeEmptyDOMElement();
});

test("the related entity is a link where the reason names it", () => {
  const onOpen = vi.fn();
  render(
    <Why
      result={pokemonNamed(sleepSearch, "paras")}
      covers={[]}
      emphasis={["sleep"]}
      onOpen={onOpen}
    />,
  );
  const why = screen.getByRole("list", { name: "Why it matches" });
  expect(why).toHaveTextContent("Causes sleep, 100% chance through spore");
  expect(within(why).getByText("sleep").tagName).toBe("EM");
  within(why).getByRole("button", { name: "Spore" }).click();
  expect(onOpen).toHaveBeenCalledWith({ kind: "move", name: "spore" });
});
