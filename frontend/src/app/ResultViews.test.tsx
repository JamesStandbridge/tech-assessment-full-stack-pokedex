import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";

import { FakeApi } from "../test/FakeApi";
import { bulbaSearch } from "../test/recorded/bulbaSearch";
import { fastElectricSearch } from "../test/recorded/fastElectricSearch";
import { sleepSearch } from "../test/recorded/sleepSearch";
import { sunTeamSearch } from "../test/recorded/sunTeamSearch";
import { App } from "./App";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

async function search(api: FakeApi, query: string): Promise<HTMLElement> {
  render(<App api={api} />);
  await userEvent.type(
    screen.getByRole("combobox", { name: "Search the Pokédex" }),
    `${query}{Enter}`,
  );
  const results = await screen.findByRole("region", { name: "Results" });
  await waitFor(() => {
    expect(new URL(window.location.href).searchParams.get("q")).toBe(query);
  });
  return results;
}

test("a criteria reading compares the ranking stat on bars", async () => {
  const results = await search(
    new FakeApi().answerSearch("fast electric pokemon", fastElectricSearch),
    "fast electric pokemon",
  );
  expect(results).toHaveAttribute("data-reading", "criteria");
  const electrode = within(results).getByRole("article", { name: "Electrode" });
  expect(within(electrode).getByRole("meter", { name: "Speed" })).toHaveAttribute(
    "aria-valuenow",
    "150",
  );
});

test("an effect reading shows the chance of success", async () => {
  const results = await search(
    new FakeApi().answerSearch("put the opponent to sleep", sleepSearch),
    "put the opponent to sleep",
  );
  const hypnosis = within(results).getByRole("article", { name: "Hypnosis" });
  expect(hypnosis).toHaveTextContent("Chance of success 60%");
});

test("a weather reading marks each result with its role", async () => {
  const results = await search(new FakeApi().answerSearch("sun team", sunTeamSearch), "sun team");
  expect(within(results).getByRole("article", { name: "Drought" })).toHaveTextContent("Setter");
  expect(within(results).getByRole("article", { name: "Thunder" })).toHaveTextContent("Drawback");
});

test("a name reading puts the best match first", async () => {
  await search(new FakeApi().answerSearch("bulba", bulbaSearch), "bulba");
  const best = screen.getByRole("region", { name: "Best match" });
  expect(within(best).getByRole("article", { name: "Bulbasaur" })).toBeVisible();
});
