import type { MoveResult, Result, SearchPlan, StatName, Stats } from "../api/contract";
import { assertNever } from "./assertNever";

export const STAT_LABELS: Readonly<Record<StatName, string>> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  speed: "Speed",
  total: "Total",
  bulk: "Bulk",
  offense: "Offense",
  power: "Power",
  accuracy: "Accuracy",
  pp: "PP",
  priority: "Priority",
};

const BASE_STATS: readonly (keyof Stats)[] = [
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
];

const none = (): null => null;

const POKEMON_STATS: Readonly<Record<StatName, (stats: Stats) => number | null>> = {
  hp: (stats) => stats.hp,
  attack: (stats) => stats.attack,
  defense: (stats) => stats.defense,
  "special-attack": (stats) => stats["special-attack"],
  "special-defense": (stats) => stats["special-defense"],
  speed: (stats) => stats.speed,
  total: (stats) => BASE_STATS.reduce((sum, name) => sum + stats[name], 0),
  bulk: (stats) => stats.hp + stats.defense + stats["special-defense"],
  offense: (stats) => Math.max(stats.attack, stats["special-attack"]),
  power: none,
  accuracy: none,
  pp: none,
  priority: none,
};

const MOVE_STATS: Readonly<Record<StatName, (move: MoveResult) => number | null>> = {
  hp: none,
  attack: none,
  defense: none,
  "special-attack": none,
  "special-defense": none,
  speed: none,
  total: none,
  bulk: none,
  offense: none,
  power: (move) => move.power,
  accuracy: (move) => move.accuracy,
  pp: (move) => move.pp,
  priority: (move) => move.priority,
};

/** Return the value of a stat for a result, or null when that kind has no such stat. */
export function statValue(result: Result, stat: StatName): number | null {
  switch (result.kind) {
    case "pokemon":
      return POKEMON_STATS[stat](result.stats);
    case "move":
      return MOVE_STATS[stat](result);
    case "ability":
      return null;
    default:
      return assertNever(result);
  }
}

/** Return the stats a criteria reading compares: those it sorts by, then those it filters on. */
export function comparedStats(plan: SearchPlan | undefined): readonly StatName[] {
  if (plan === undefined) {
    return [];
  }
  const sorted = plan.stat_sort.map((sort) => sort.stat);
  const filtered = plan.stat_filters.map((filter) => filter.stat);
  return [...new Set([...sorted, ...filtered])];
}
