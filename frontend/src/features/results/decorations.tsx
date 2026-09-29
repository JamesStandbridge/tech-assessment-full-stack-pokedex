import type { JSX, ReactNode } from "react";

import type { Result, StatName, WeatherRole } from "../../api/contract";
import { effectChance, formatChance, weatherRole } from "../../domain/reasons";
import { STAT_LABELS } from "../../domain/stats";
import { statBars } from "../../domain/views";
import { Bar } from "../../ui/Bar";

/** Extra content a view adds to each result card, given every result shown. */
export type Decoration = (result: Result, shown: readonly Result[]) => ReactNode;

const ROLE_LABELS: Readonly<Record<WeatherRole, string>> = {
  setter: "Setter",
  benefit: "Benefit",
  protection: "Protection",
  mixed: "Mixed",
  drawback: "Drawback",
};

export function comparisonBars(stats: readonly StatName[]): Decoration {
  return function ComparisonBars(result, shown): JSX.Element | null {
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
  };
}

export function chanceBadge(result: Result): JSX.Element | null {
  const chance = effectChance(result);
  if (chance === null) return null;
  return (
    <p className="text-sm">
      <span className="text-muted">Chance of success </span>
      <span className="text-tone-effect font-mono text-lg font-semibold">
        {formatChance(chance)}
      </span>
    </p>
  );
}

export function roleBadge(result: Result): JSX.Element | null {
  const role = weatherRole(result);
  if (role === null) return null;
  return (
    <p className="border-line inline-flex items-center gap-2 rounded-full border px-3 py-0.5 text-sm">
      <span
        aria-hidden="true"
        className="size-2 rounded-full"
        style={{ backgroundColor: `var(--color-role-${role})` }}
      />
      {ROLE_LABELS[role]}
    </p>
  );
}
