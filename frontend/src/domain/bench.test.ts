import { expect, test } from "vitest";

import { benchRows, type Contender, replacements } from "./bench";

const stats = (speed: number, hp: number): Contender["stats"] => ({
  hp,
  attack: 50,
  defense: 50,
  "special-attack": 50,
  "special-defense": 50,
  speed,
});

const jolteon: Contender = { name: "jolteon", types: ["electric"], stats: stats(130, 65) };
const snorlax: Contender = { name: "snorlax", types: ["normal"], stats: stats(30, 160) };

function row(stat: string, reference: string | null = null) {
  return benchRows([jolteon, snorlax], reference).find((one) => one.stat === stat);
}

test("the bench names the leader of every stat", () => {
  expect(row("speed")?.cells.map((cell) => cell.leader)).toEqual([true, false]);
  expect(row("hp")?.cells.map((cell) => cell.leader)).toEqual([false, true]);
  expect(benchRows([jolteon], null)[0]?.cells[0]?.leader).toBe(false);
});

test("a pinned reference gives the others signed differences", () => {
  expect(row("speed", "jolteon")?.cells.map((cell) => cell.difference)).toEqual([null, -100]);
  expect(row("speed")?.cells.map((cell) => cell.difference)).toEqual([null, null]);
});

test("a replacement says which stats and types it gains and loses", () => {
  const lapras: Contender = { name: "lapras", types: ["water", "ice"], stats: stats(60, 130) };
  const [first, second] = replacements([jolteon, lapras], snorlax);
  expect(first).toMatchObject({ member: "jolteon", gains: ["normal"], losses: ["electric"] });
  expect(first?.differences).toContainEqual({ stat: "speed", label: "Speed", difference: -100 });
  expect(second).toMatchObject({ member: "lapras", losses: ["water", "ice"] });
});
