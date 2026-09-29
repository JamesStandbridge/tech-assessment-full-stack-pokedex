import { type JSX, type PointerEvent, useId } from "react";

import type { EntityRef, PokemonResult } from "../../api/contract";
import { displayName, refOf } from "../../domain/entities";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { RemoteImage } from "../../ui/RemoteImage";
import { typeColor } from "../colors";

const MAX_TILT_DEG = 10;

/** Follow the pointer with CSS variables, so the tilt needs no React render. */
function tilt(event: PointerEvent<HTMLElement>): void {
  const card = event.currentTarget;
  const box = card.getBoundingClientRect();
  const x = (event.clientX - box.left) / box.width - 0.5;
  const y = (event.clientY - box.top) / box.height - 0.5;
  card.style.setProperty("--tilt-x", `${String(-y * MAX_TILT_DEG)}deg`);
  card.style.setProperty("--tilt-y", `${String(x * MAX_TILT_DEG)}deg`);
  card.style.setProperty("--glare-x", `${String((x + 0.5) * 100)}%`);
  card.style.setProperty("--glare-y", `${String((y + 0.5) * 100)}%`);
}

function rest(event: PointerEvent<HTMLElement>): void {
  for (const name of ["--tilt-x", "--tilt-y"]) event.currentTarget.style.setProperty(name, "0deg");
}

function CardHeader(props: {
  readonly pokemon: PokemonResult;
  readonly titleId: string;
  readonly onOpen: (ref: EntityRef) => void;
}): JSX.Element {
  const { pokemon, titleId, onOpen } = props;
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-xl font-bold">
        <Button
          id={titleId}
          variant="quiet"
          onPress={() => {
            onOpen(refOf(pokemon));
          }}
        >
          {displayName(pokemon.name)}
        </Button>
      </h3>
      <span className="text-muted font-mono text-sm">#{String(pokemon.id).padStart(3, "0")}</span>
    </div>
  );
}

/** The best match presented as a collectible card: artwork, genus and description (SYS-UI-009). */
export function HoloCard(props: {
  readonly pokemon: PokemonResult;
  readonly onOpen: (ref: EntityRef) => void;
}): JSX.Element {
  const titleId = useId();
  const { pokemon, onOpen } = props;
  const name = displayName(pokemon.name);
  return (
    <article
      aria-labelledby={titleId}
      onPointerMove={tilt}
      onPointerLeave={rest}
      className="holo-card shadow-glow relative mx-auto grid max-w-md gap-3 overflow-hidden rounded-[1.75rem] border-4 p-5"
      style={{ borderColor: typeColor(pokemon.types[0] ?? "normal") }}
    >
      <CardHeader pokemon={pokemon} titleId={titleId} onOpen={onOpen} />
      <div className="bg-panel-raised/70 grid place-items-center rounded-2xl p-3">
        <RemoteImage src={pokemon.artwork_url} alt={name} size={220} eager />
      </div>
      <div className="flex gap-1">
        {pokemon.types.map((type) => (
          <Chip key={type} label={type} color={typeColor(type)} />
        ))}
      </div>
      <p className="text-muted text-sm font-semibold">{pokemon.genus}</p>
      <p className="text-sm leading-relaxed">{pokemon.description}</p>
    </article>
  );
}
