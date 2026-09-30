import type { StatName, Stats } from "../api/contract";
import { pokemonStat, STAT_LABELS } from "./stats";

/** What the bench and the party need of a Pokémon: the species list provides it. */
export interface Contender {
  readonly name: string;
  readonly types: readonly string[];
  readonly stats: Stats;
}

const BENCH_STATS: readonly StatName[] = [
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
  "total",
];

export interface BenchCell {
  readonly name: string;
  readonly value: number;
  /** Highest of the row, when at least two Pokémon are compared. */
  readonly leader: boolean;
  /** Signed difference from the reference, null for the reference itself or without one. */
  readonly difference: number | null;
}

export interface BenchRow {
  readonly stat: StatName;
  readonly label: string;
  readonly cells: readonly BenchCell[];
}

/** A difference with its sign, as "+20", "-100" or "0". */
export function signed(value: number): string {
  return value > 0 ? `+${String(value)}` : String(value);
}

function valueOf(contender: Contender, stat: StatName): number {
  return pokemonStat(contender.stats, stat) ?? 0;
}

/** One row per stat: leaders, and signed differences from the pinned reference (SYS-UI-028). */
export function benchRows(
  contenders: readonly Contender[],
  reference: string | null,
): readonly BenchRow[] {
  const pinned = contenders.find((contender) => contender.name === reference) ?? null;
  return BENCH_STATS.map((stat) => {
    const values = contenders.map((contender) => valueOf(contender, stat));
    const best = Math.max(...values);
    const base = pinned === null ? null : valueOf(pinned, stat);
    return {
      stat,
      label: STAT_LABELS[stat],
      cells: contenders.map((contender, index) => {
        const value = values[index] ?? 0;
        return {
          name: contender.name,
          value,
          leader: contenders.length > 1 && value === best,
          difference: base === null || contender === pinned ? null : value - base,
        };
      }),
    };
  });
}

interface StatDifference {
  readonly stat: StatName;
  readonly label: string;
  readonly difference: number;
}

/** What replacing one member of a full party with the newcomer changes (SYS-UI-029). */
export interface Replacement {
  readonly member: string;
  readonly differences: readonly StatDifference[];
  readonly gains: readonly string[];
  readonly losses: readonly string[];
}

function typesOf(contenders: readonly Contender[]): ReadonlySet<string> {
  return new Set(contenders.flatMap((contender) => contender.types));
}

function replacement(
  party: readonly Contender[],
  member: Contender,
  newcomer: Contender,
): Replacement {
  const rest = typesOf(party.filter((other) => other !== member));
  const after = new Set([...rest, ...newcomer.types]);
  return {
    member: member.name,
    differences: BENCH_STATS.map((stat) => ({
      stat,
      label: STAT_LABELS[stat],
      difference: valueOf(newcomer, stat) - valueOf(member, stat),
    })).filter((change) => change.difference !== 0),
    gains: newcomer.types.filter((type) => !rest.has(type)),
    losses: member.types.filter((type) => !after.has(type)),
  };
}

export function replacements(
  party: readonly Contender[],
  newcomer: Contender,
): readonly Replacement[] {
  return party.map((member) => replacement(party, member, newcomer));
}
