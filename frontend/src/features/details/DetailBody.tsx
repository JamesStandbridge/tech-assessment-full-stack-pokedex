import type { JSX } from "react";

import type {
  AbilityDetail,
  EntityDetail,
  EntityRef,
  MoveDetail,
  PokemonDetail,
} from "../../api/contract";
import { assertNever } from "../../domain/assertNever";
import { displayName } from "../../domain/entities";
import { STAT_LABELS } from "../../domain/stats";
import { Bar } from "../../ui/Bar";
import { Chip } from "../../ui/Chip";
import { Button } from "../../ui/Button";
import { RemoteImage } from "../../ui/RemoteImage";
import { canSpeak, speak } from "../speech/speech";
import { typeColor } from "../colors";
import { RelatedList } from "./RelatedList";

const MAX_BASE_STAT = 255;
type Open = (ref: EntityRef) => void;

function BaseStats({ detail }: { readonly detail: PokemonDetail }): JSX.Element {
  const stats = Object.entries(detail.stats).flatMap(([name, value]) => {
    const label = Object.entries(STAT_LABELS).find(([stat]) => stat === name)?.[1];
    return label === undefined ? [] : [{ label, value }];
  });
  return (
    <div className="space-y-2">
      {stats.map((stat) => (
        <Bar
          key={stat.label}
          label={stat.label}
          value={stat.value}
          share={stat.value / MAX_BASE_STAT}
          color="var(--color-accent)"
        />
      ))}
    </div>
  );
}

function PokemonBody({
  detail,
  onOpen,
}: {
  readonly detail: PokemonDetail;
  readonly onOpen: Open;
}): JSX.Element {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-5">
        <RemoteImage src={detail.artwork_url} alt={displayName(detail.name)} size={160} eager />
        <div className="space-y-2">
          <p className="text-muted">{detail.genus}</p>
          <div className="flex gap-1">
            {detail.types.map((type) => (
              <Chip key={type} label={type} color={typeColor(type)} />
            ))}
          </div>
          <p className="max-w-prose">{detail.description}</p>
          {canSpeak() ? (
            <Button
              variant="outline"
              onPress={() => {
                speak(
                  `${displayName(detail.name)}. ${detail.genus ?? ""}. ${detail.description ?? ""}`,
                );
              }}
            >
              Read the entry aloud
            </Button>
          ) : null}
        </div>
      </div>
      <BaseStats detail={detail} />
      <RelatedList title="Abilities" kind="ability" names={detail.abilities} onOpen={onOpen} />
      <RelatedList title="Moves" kind="move" names={detail.moves} onOpen={onOpen} />
    </div>
  );
}

function MoveBody({
  detail,
  onOpen,
}: {
  readonly detail: MoveDetail;
  readonly onOpen: Open;
}): JSX.Element {
  const facts: readonly [string, number | null][] = [
    ["Power", detail.power],
    ["Accuracy", detail.accuracy],
    ["PP", detail.pp],
    ["Priority", detail.priority],
  ];
  return (
    <div className="space-y-4">
      <p className="text-muted">
        {detail.type} · {detail.damage_class}
      </p>
      <dl className="grid grid-cols-4 gap-2 text-center">
        {facts.map(([label, value]) => (
          <div key={label} className="bg-panel-raised rounded-xl p-2">
            <dt className="text-muted text-xs">{label}</dt>
            <dd className="font-mono">{value ?? "—"}</dd>
          </div>
        ))}
      </dl>
      <p>{detail.effect ?? detail.short_effect}</p>
      <RelatedList title="Learned by" kind="pokemon" names={detail.learned_by} onOpen={onOpen} />
    </div>
  );
}

function AbilityBody({
  detail,
  onOpen,
}: {
  readonly detail: AbilityDetail;
  readonly onOpen: Open;
}): JSX.Element {
  return (
    <div className="space-y-4">
      <p>{detail.effect ?? detail.short_effect}</p>
      <RelatedList title="Pokémon" kind="pokemon" names={detail.pokemon} onOpen={onOpen} />
    </div>
  );
}

export function DetailBody({
  detail,
  onOpen,
}: {
  readonly detail: EntityDetail;
  readonly onOpen: Open;
}): JSX.Element {
  switch (detail.kind) {
    case "pokemon":
      return <PokemonBody detail={detail} onOpen={onOpen} />;
    case "move":
      return <MoveBody detail={detail} onOpen={onOpen} />;
    case "ability":
      return <AbilityBody detail={detail} onOpen={onOpen} />;
    default:
      return assertNever(detail);
  }
}
