import type { JSX } from "react";

import type { PokemonResult } from "../../api/contract";
import { displayName } from "../../domain/entities";
import { STAT_LABELS } from "../../domain/stats";
import { Panel } from "../../ui/Panel";

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 110;
const MAX_STAT = 255;
const SERIES = ["var(--color-tone-stat)", "var(--color-tone-effect)", "var(--color-tone-kind)"];
const STATS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"] as const;

function point(index: number, share: number): string {
  const angle = (Math.PI * 2 * index) / STATS.length - Math.PI / 2;
  return `${String(CENTER + Math.cos(angle) * RADIUS * share)},${String(CENTER + Math.sin(angle) * RADIUS * share)}`;
}

function polygon(pokemon: PokemonResult): string {
  return STATS.map((stat, index) => point(index, pokemon.stats[stat] / MAX_STAT)).join(" ");
}

function Radar(props: {
  readonly selected: readonly PokemonResult[];
  readonly names: readonly string[];
}): JSX.Element {
  return (
    <svg
      role="img"
      aria-label={`Stat profiles of ${props.names.join(" and ")}`}
      viewBox={`0 0 ${String(SIZE)} ${String(SIZE)}`}
      className="mx-auto w-full max-w-xs"
    >
      {[0.25, 0.5, 0.75, 1].map((share) => (
        <polygon
          key={share}
          points={STATS.map((_, index) => point(index, share)).join(" ")}
          className="stroke-rule fill-none"
          strokeDasharray={share === 1 ? undefined : "2 3"}
        />
      ))}
      {props.selected.map((pokemon, index) => (
        <polygon
          key={pokemon.name}
          points={polygon(pokemon)}
          fill={SERIES[index % SERIES.length]}
          fillOpacity={0.25}
          stroke={SERIES[index % SERIES.length]}
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}

function StatTable(props: {
  readonly selected: readonly PokemonResult[];
  readonly names: readonly string[];
}): JSX.Element {
  return (
    <table className="w-full text-sm">
      <caption className="catalogue text-muted mb-2 text-left">
        Base stats of the selected Pokémon
      </caption>
      <thead>
        <tr>
          <th scope="col" className="catalogue text-muted text-left font-normal">
            Stat
          </th>
          {props.names.map((name) => (
            <th key={name} scope="col" className="font-display text-right text-base font-semibold">
              {name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {STATS.map((stat) => (
          <tr key={stat} className="border-line border-t">
            <th scope="row" className="text-muted py-1 text-left text-xs font-normal">
              {STAT_LABELS[stat]}
            </th>
            {props.selected.map((pokemon) => (
              <td key={pokemon.name} className="py-1 text-right font-mono tabular-nums">
                {pokemon.stats[stat]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Stat profiles of the selected Pokémon overlaid on one radar, with the same values as a table. */
export function StatOverlay({
  selected,
}: {
  readonly selected: readonly PokemonResult[];
}): JSX.Element {
  const names = selected.map((pokemon) => displayName(pokemon.name));
  return (
    <Panel
      label="Stat comparison"
      eyebrow="Overlay"
      title="Stat profiles"
      count={String(selected.length)}
    >
      <div className="grid gap-4">
        <Radar selected={selected} names={names} />
        <StatTable selected={selected} names={names} />
      </div>
    </Panel>
  );
}
