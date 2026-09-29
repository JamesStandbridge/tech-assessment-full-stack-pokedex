import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";

import { App } from "./App";
import { ApiError } from "../api/errors";
import { FakeApi } from "../test/FakeApi";
import { emptySearch } from "../test/recorded/emptySearch";
import { pikachuDetail } from "../test/recorded/pikachuDetail";
import { psychicSearch } from "../test/recorded/psychicSearch";
import { sleepSearch } from "../test/recorded/sleepSearch";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

/** The URL is written asynchronously; a test ends once it holds the query it ran. */
async function urlHolds(query: string): Promise<void> {
  await waitFor(() => {
    expect(new URL(window.location.href).searchParams.get("q")).toBe(query);
  });
}

function box(): HTMLElement {
  return screen.getByRole("combobox", { name: "Search the Pokédex" });
}

test("an example runs its query and shows results with their reasons", async () => {
  const api = new FakeApi().answerSearch("put the opponent to sleep", sleepSearch);
  render(<App api={api} />);
  await userEvent.click(screen.getByRole("button", { name: "put the opponent to sleep" }));
  const moves = await screen.findByRole("region", { name: "Moves" });
  expect(within(moves).getByRole("article", { name: "Spore" })).toHaveTextContent("100% chance");
  expect(box()).toHaveValue("put the opponent to sleep");
  await urlHolds("put the opponent to sleep");
});

test("a pause in typing searches once and shows how the query was read", async () => {
  const api = new FakeApi().answerSearch("psychic", psychicSearch);
  render(<App api={api} />);
  await userEvent.type(box(), "psychic");
  const terms = await screen.findByRole("list", { name: "How the query was understood" });
  expect(terms).toHaveTextContent("psychic");
  expect(screen.getByRole("list", { name: "Readings" })).toHaveTextContent("of type psychic");
  expect(api.searches).toHaveLength(1);
  await urlHolds("psychic");
});

test("an empty outcome explains itself and its suggestions run", async () => {
  const api = new FakeApi().answerSearch("xyzzy", emptySearch).answerSearch("bulba", sleepSearch);
  render(<App api={api} />);
  await userEvent.type(box(), "xyzzy{Enter}");
  expect(await screen.findByRole("heading", { name: "No match in the Pokédex" })).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Try 'bulba'" }));
  expect(await screen.findByRole("region", { name: "Results" })).toBeVisible();
  await urlHolds("bulba");
});

test("an invalid query shows the API's message", async () => {
  const api = new FakeApi().answerSearch("a", new ApiError("invalid", "Too short."));
  render(<App api={api} />);
  await userEvent.type(box(), "a{Enter}");
  expect(
    await screen.findByRole("heading", { name: "This query cannot be searched" }),
  ).toBeVisible();
  expect(screen.getByText("Too short.")).toBeVisible();
  await urlHolds("a");
});

test("a failure offers a retry that runs the search again", async () => {
  const failure = new ApiError("not-found", "Unreachable.");
  const api = new FakeApi().answerSearch("pikachu", failure, sleepSearch);
  render(<App api={api} />);
  await userEvent.type(box(), "pikachu{Enter}");
  await userEvent.click(await screen.findByRole("button", { name: "Retry" }));
  expect(await screen.findByRole("region", { name: "Results" })).toBeVisible();
  await urlHolds("pikachu");
});

test("a result opens its details, whose relations open in turn", async () => {
  const api = new FakeApi()
    .answerSearch("put the opponent to sleep", sleepSearch)
    .answerEntity(pikachuDetail);
  render(<App api={api} />);
  await userEvent.type(box(), "put the opponent to sleep{Enter}");
  const moves = await screen.findByRole("region", { name: "Moves" });
  await userEvent.click(within(moves).getByRole("button", { name: "Spore" }));
  const dialog = await screen.findByRole("dialog", { name: "Spore" });
  expect(await within(dialog).findByText("Missing.")).toBeVisible();
  await urlHolds("put the opponent to sleep");
});
