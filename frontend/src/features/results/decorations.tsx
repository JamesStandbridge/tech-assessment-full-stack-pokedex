import type { JSX, ReactNode } from "react";

import type { Reason, Result, StatName, WeatherRole } from "../../api/contract";
import { effectChance, formatChance, weatherRole } from "../../domain/reasons";
import { STAT_LABELS } from "../../domain/stats";
import { statBars } from "../../domain/views";
import { Bar } from "../../ui/Bar";

/** What a view adds to each result of its sections. */
export interface Decoration {
  /** The measure the query is about, on one line aligned across every result. */
  readonly metric: (result: Result, shown: readonly Result[]) => ReactNode;
  /** A control of the view, placed in the action bar of the result. */
  readonly action: ((result: Result) => ReactNode) | null;
  /** Kinds of reason the metric already shows, left out of the reasons line. */
  readonly covers: readonly Reason["type"][];
}

const ROLE_LABELS: Readonly<Record<WeatherRole, string>> = {
  setter: "Setter",
  benefit: "Benefit",
  protection: "Protection",
  mixed: "Mixed",
  drawback: "Drawback",
};

export function comparisonBars(stats: readonly StatName[]): Decoration {
  function ComparisonBars(result: Result, shown: readonly Result[]): JSX.Element | null {
    const bars = statBars(result, stats, shown);
    if (bars.length === 0) return null;
    return (
      <div className="space-y-1">
        {bars.map((bar) => (
          <Bar
            key={bar.stat}
            label={STAT_LABELS[bar.stat]}
            value={bar.value}
            share={bar.share}
            color="var(--color-tone-stat)"
          />
        ))}
      </div>
    );
  }
  return { metric: ComparisonBars, action: null, covers: ["stat-rank", "stat-filter"] };
}

function ChanceOfSuccess(result: Result): JSX.Element | null {
  const chance = effectChance(result);
  if (chance === null) return null;
  return (
    <p className="grid grid-cols-[5.5rem_1fr_2.75rem] items-center gap-3">
      <span className="catalogue text-muted">
        Chance<span className="sr-only"> of success</span>
      </span>{" "}
      <span aria-hidden="true" className="graduated bg-panel-raised block h-1.5 overflow-hidden">
        <span
          className="bg-tone-effect block h-full origin-left"
          style={{ transform: `scaleX(${String(chance)})` }}
        />
      </span>
      <span className="text-tone-effect text-right font-mono text-sm tabular-nums">
        {formatChance(chance)}
      </span>
    </p>
  );
}

export const chanceOfSuccess: Decoration = { metric: ChanceOfSuccess, action: null, covers: [] };

function WeatherRoleMark(result: Result): JSX.Element | null {
  const role = weatherRole(result);
  if (role === null) return null;
  return (
    <p className="catalogue rounded-control border-line inline-flex items-center gap-2 border px-2 py-0.5">
      <span
        aria-hidden="true"
        className="size-1.5 rotate-45"
        style={{ backgroundColor: `var(--color-role-${role})` }}
      />
      {ROLE_LABELS[role]}
    </p>
  );
}

export const weatherRoleMark: Decoration = { metric: WeatherRoleMark, action: null, covers: [] };
