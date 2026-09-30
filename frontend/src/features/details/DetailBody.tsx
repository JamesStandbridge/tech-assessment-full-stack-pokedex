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
import { RemoteImage } from "../../ui/RemoteImage";
import { TypeBadge } from "../../ui/TypeBadge";
import { typeColor } from "../colors";
import { RelatedList } from "./RelatedList";

const MAX_BASE_STAT = 255;
type Open = (ref: EntityRef) => void;

function BaseStats({ detail }: { readonly detail: PokemonDetail }): JSX.Element {
  const color = typeColor(detail.types[0] ?? "normal");
  const stats = Object.entries(detail.stats).flatMap(([name, value]) => {
    const label = Object.entries(STAT_LABELS).find(([stat]) => stat === name)?.[1];
    return label === undefined ? [] : [{ label, value }];
  });
  return (
    <div className="space-y-2">
      <h3 className="catalogue text-muted">Base stats</h3>
      {stats.map((stat) => (
        <Bar
          key={stat.label}
          label={stat.label}
          value={stat.value}
          share={stat.value / MAX_BASE_STAT}
          color={color}
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
        <div className="specimen p-2">
          <RemoteImage src={detail.artwork_url} alt={displayName(detail.name)} size={160} eager />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-display text-muted text-lg italic">{detail.genus}</p>
          <div className="flex gap-1">
            {detail.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
          <p className="max-w-prose leading-relaxed">{detail.description}</p>
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
      <p className="flex items-center gap-2">
        <TypeBadge type={detail.type} />
        <span className="catalogue text-muted">{detail.damage_class}</span>
      </p>
      <dl className="border-rule divide-line grid grid-cols-4 divide-x border-y text-center">
        {facts.map(([label, value]) => (
          <div key={label} className="py-2">
            <dt className="catalogue text-muted">{label}</dt>
            <dd className="font-mono text-lg tabular-nums">{value ?? "—"}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm leading-relaxed">{detail.effect ?? detail.short_effect}</p>
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
      <p className="text-sm leading-relaxed">{detail.effect ?? detail.short_effect}</p>
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
