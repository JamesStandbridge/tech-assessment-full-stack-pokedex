import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";

import { FakeApi } from "../test/FakeApi";
import { rainTeamSearch } from "../test/recorded/rainTeamSearch";
import { App } from "./App";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

async function urlHolds(query: string): Promise<void> {
  await waitFor(() => {
    expect(new URL(window.location.href).searchParams.get("q")).toBe(query);
  });
}

test("Pokémon added from a weather search share that weather in the party", async () => {
  render(<App api={new FakeApi().answerSearch("rain team", rainTeamSearch)} />);
  await userEvent.type(
    screen.getByRole("combobox", { name: "Search the Pokédex" }),
    "rain team{Enter}",
  );
  await userEvent.click(await screen.findByRole("button", { name: "Add Lapras to the party" }));
  await userEvent.click(screen.getByRole("button", { name: "Add Squirtle to the party" }));
  const party = await screen.findByRole("region", { name: "Party" });
  expect(within(party).getAllByRole("listitem")).toHaveLength(2);
  await waitFor(() => {
    expect(party).toHaveTextContent("All of them help with rain");
  });
  for (const added of screen.getAllByRole("button", { name: "In the party" })) {
    expect(added).toBeDisabled();
  }
  await userEvent.click(within(party).getByRole("button", { name: "Remove Lapras" }));
  expect(within(party).getAllByRole("listitem")).toHaveLength(1);
  await urlHolds("rain team");
});
