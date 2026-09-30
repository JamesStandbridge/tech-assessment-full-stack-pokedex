import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test } from "vitest";

import { FakeApi } from "../test/FakeApi";
import { bulbaSearch } from "../test/recorded/bulbaSearch";
import { rainTeamSearch } from "../test/recorded/rainTeamSearch";
import { App } from "./App";

class FakeRecognition {
  lang = "";
  interimResults = true;
  onresult: ((event: { results: { transcript: string }[][] }) => void) | null = null;
  start(): void {
    this.onresult?.({ results: [[{ transcript: "bulba" }]] });
  }
}

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  Reflect.deleteProperty(window, "SpeechRecognition");
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

test("a spoken query is searched when the browser can listen", async () => {
  Object.assign(window, { SpeechRecognition: FakeRecognition });
  render(<App api={new FakeApi().answerSearch("bulba", bulbaSearch)} />);
  await userEvent.click(screen.getByRole("button", { name: "Search by voice" }));
  expect(screen.getByRole("combobox", { name: "Search the Pokédex" })).toHaveValue("bulba");
  await urlHolds("bulba");
});

test("without speech recognition there is no voice button", () => {
  render(<App api={new FakeApi()} />);
  expect(screen.queryByRole("button", { name: "Search by voice" })).toBeNull();
});
