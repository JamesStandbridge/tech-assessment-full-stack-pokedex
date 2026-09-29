import { type JSX, lazy, Suspense, useState } from "react";

import type { PokemonResult } from "../../api/contract";
import { displayName } from "../../domain/entities";
import { comparedStats } from "../../domain/stats";
import { Checkbox } from "../../ui/Checkbox";
import { AddToTeam } from "../team/TeamTray";
import { comparisonBars, type Decoration } from "./decorations";
import { type ResultsViewProps, Sections } from "./Sections";

const StatOverlay = lazy(async () => {
  const module = await import("../extras/StatOverlay");
  return { default: module.StatOverlay };
});

const MAX_COMPARED = 3;
const MIN_OVERLAY = 2;

/** A criteria reading: bars for the compared stats, and profiles of chosen Pokémon (SYS-UI-011). */
export function CriteriaView(props: ResultsViewProps): JSX.Element {
  const [selected, setSelected] = useState<readonly PokemonResult[]>([]);
  const bars = comparisonBars(comparedStats(props.response.interpretation.alternatives[0]));
  const toggle = (pokemon: PokemonResult, checked: boolean): void => {
    setSelected((current) =>
      checked ? [...current, pokemon] : current.filter((other) => other.name !== pokemon.name),
    );
  };
  const decorate: Decoration = (result, shown) => {
    if (result.kind !== "pokemon") return bars(result, shown);
    const checked = selected.some((pokemon) => pokemon.name === result.name);
    return (
      <>
        {bars(result, shown)}
        <div className="flex flex-wrap items-center gap-3">
          <Checkbox
            label={`Compare ${displayName(result.name)}`}
            checked={checked}
            disabled={!checked && selected.length >= MAX_COMPARED}
            onChange={(value) => {
              toggle(result, value);
            }}
          />
          <AddToTeam pokemon={result} weather={null} />
        </div>
      </>
    );
  };
  return (
    <>
      {selected.length >= MIN_OVERLAY ? (
        <Suspense fallback={null}>
          <StatOverlay selected={selected} />
        </Suspense>
      ) : null}
      <Sections {...props} decorate={decorate} />
    </>
  );
}
