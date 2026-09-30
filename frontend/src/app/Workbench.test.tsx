import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";

import { FakeApi } from "../test/FakeApi";
import { fastElectricSearch } from "../test/recorded/fastElectricSearch";
import { rainTeamSearch } from "../test/recorded/rainTeamSearch";
import { App } from "./App";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

async function search(query: string): Promise<void> {
  const api = new FakeApi()
    .answerSearch("rain team", rainTeamSearch)
    .answerSearch("fast electric pokemon", fastElectricSearch);
  render(<App api={api} />);
  await userEvent.type(
    screen.getByRole("combobox", { name: "Search the Pokédex" }),
    `${query}{Enter}`,
  );
  await screen.findByRole("region", { name: "Results" });
}

async function add(name: string): Promise<void> {
  await userEvent.click(await screen.findByRole("button", { name: `Add ${name} to the party` }));
}

function blur(): void {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
}

function members(): readonly (string | undefined)[] {
  const party = screen.queryByRole("region", { name: "Party" });
  if (party === null) return [];
  return [...party.querySelectorAll<HTMLElement>("[data-member]")].map(
    (member) => member.dataset["member"],
  );
}

test("a removal is announced, undone with the announcement and redone with the keyboard", async () => {
  await search("rain team");
  await add("Lapras");
  await add("Squirtle");
  const party = await screen.findByRole("region", { name: "Party" });
  await userEvent.click(within(party).getByRole("button", { name: "Remove Lapras" }));
  const status = screen.getByRole("status", { name: "Workbench changes" });
  expect(status).toHaveTextContent("Removed Lapras");
  await userEvent.click(within(status).getByRole("button", { name: "Undo" }));
  expect(members()).toEqual(["lapras", "squirtle"]);
  blur();
  await userEvent.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");
  expect(members()).toEqual(["squirtle"]);
  await userEvent.keyboard("{Control>}z{/Control}");
  expect(members()).toEqual(["lapras", "squirtle"]);
});

test("the undo shortcut in the search box leaves the party alone", async () => {
  await search("rain team");
  await add("Lapras");
  await userEvent.click(screen.getByRole("combobox", { name: "Search the Pokédex" }));
  await userEvent.keyboard("{Control>}z{/Control}");
  expect(members()).toEqual(["lapras"]);
});

test("a full party asks whom a newcomer replaces and what each choice trades", async () => {
  window.history.replaceState(null, "", "/?party=goldeen,seaking,psyduck,golduck,horsea,kabuto");
  await search("rain team");
  await add("Lapras");
  const prompt = screen.getByRole("group", { name: "Replace whom with Lapras?" });
  expect(within(prompt).getAllByRole("listitem")).toHaveLength(6);
  expect(prompt).toHaveTextContent(/gains ice; loses rock/);
  await userEvent.click(
    within(prompt).getByRole("button", { name: "Replace Goldeen with Lapras" }),
  );
  expect(members()).toContain("lapras");
  expect(members()).not.toContain("goldeen");
});

test("the bench names leaders and measures against a pinned reference", async () => {
  await search("fast electric pokemon");
  await userEvent.click(screen.getByRole("button", { name: "Compare Electrode on the bench" }));
  await userEvent.click(screen.getByRole("button", { name: "Compare Voltorb on the bench" }));
  const bench = screen.getByRole("region", { name: "Bench" });
  const speed = within(bench).getByRole("row", { name: /^Speed/ });
  expect(speed.querySelector('[data-contender="electrode"]')).toHaveAttribute(
    "data-leader",
    "true",
  );
  await userEvent.click(
    within(bench).getByRole("button", { name: "Pin Electrode as the reference" }),
  );
  expect(speed.querySelector('[data-contender="voltorb"]')).toHaveTextContent("(-50)");
  await waitFor(() => {
    const address = new URL(window.location.href).searchParams;
    expect(address.get("compare")).toBe("electrode,voltorb");
    expect(address.get("ref")).toBe("electrode");
  });
});

test("keyboard shortcuts move between results, add, compare and list themselves", async () => {
  await search("fast electric pokemon");
  blur();
  await userEvent.keyboard("j");
  expect(document.activeElement).toHaveAttribute("data-result", "pokemon:electrode");
  await userEvent.keyboard("tc");
  expect(members()).toEqual(["electrode"]);
  expect(screen.getByRole("region", { name: "Bench" })).toBeInTheDocument();
  await userEvent.keyboard("?");
  expect(await screen.findByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();
  await userEvent.keyboard("{Escape}");
  await userEvent.keyboard("/");
  expect(screen.getByRole("combobox", { name: "Search the Pokédex" })).toHaveFocus();
});

test("a shared address restores the party and the bench", async () => {
  window.history.replaceState(null, "", "/?party=lapras,seel&compare=lapras&ref=lapras");
  render(<App api={new FakeApi()} />);
  await waitFor(() => {
    expect(members()).toEqual(["lapras", "seel"]);
  });
  expect(screen.getByRole("region", { name: "Bench" })).toHaveTextContent("Lapras");
});
