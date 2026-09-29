import type { JSX } from "react";

import type { PokemonResult } from "../../api/contract";
import { displayName } from "../../domain/entities";
import { memberOf, sharedWeathers, TEAM_SIZE } from "../../domain/team";
import { Button } from "../../ui/Button";
import { RemoteImage } from "../../ui/RemoteImage";
import { useTeam } from "./TeamContext";

/** The button that adds a Pokémon of the results to the team. */
export function AddToTeam(props: {
  readonly pokemon: PokemonResult;
  readonly weather: string | null;
}): JSX.Element {
  const team = useTeam();
  const member = memberOf(props.pokemon, props.weather);
  const added = team.has(member.ref);
  return (
    <Button
      variant="outline"
      isDisabled={added || team.isFull}
      onPress={() => {
        team.add(member);
      }}
    >
      {added ? "In the team" : `Add ${displayName(props.pokemon.name)} to the team`}
    </Button>
  );
}

/** Up to six Pokémon and the weathers they all help with (SYS-UI-013). */
export function TeamTray(): JSX.Element | null {
  const team = useTeam();
  if (team.members.length === 0) return null;
  const shared = sharedWeathers(team.members);
  return (
    <section
      aria-label="Team"
      className="rounded-card border-line bg-panel/80 shadow-glow border p-4"
    >
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold">
          Team {team.members.length}/{TEAM_SIZE}
        </h2>
        <p className="text-muted text-sm">
          {shared.length > 0
            ? `All of them help with ${shared.join(" and ")}`
            : "No weather shared yet"}
        </p>
      </div>
      <ul className="flex flex-wrap gap-3">
        {team.members.map((member) => (
          <li
            key={member.ref.name}
            className="bg-panel-raised flex items-center gap-2 rounded-full pr-2"
          >
            <RemoteImage src={member.spriteUrl} alt={displayName(member.ref.name)} size={40} />
            <Button
              variant="quiet"
              onPress={() => {
                team.remove(member.ref);
              }}
            >
              Remove {displayName(member.ref.name)}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
