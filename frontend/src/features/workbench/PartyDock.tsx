import type { JSX } from "react";

import type { Species } from "../../api/contract";
import { displayName } from "../../domain/entities";
import { PARTY_SIZE } from "../../domain/workbench";
import { Button } from "../../ui/Button";
import { RemoteImage } from "../../ui/RemoteImage";
import { useContenders, useSharedWeathers } from "./data";
import { ReplacePrompt } from "./ReplacePrompt";
import { useWorkbench } from "./WorkbenchContext";

function Member(props: { readonly member: Species; readonly onRemove: () => void }): JSX.Element {
  const name = displayName(props.member.name);
  return (
    <li
      data-member={props.member.name}
      className="specimen flex min-w-0 items-center gap-1 py-0.5 pr-0.5 pl-1"
    >
      <RemoteImage src={props.member.sprite_url} alt={name} size={32} />
      <span className="min-w-0 flex-1 truncate text-xs">{name}</span>
      <Button variant="quiet" size="small" aria-label={`Remove ${name}`} onPress={props.onRemove}>
        <span aria-hidden="true">&times;</span>
      </Button>
    </li>
  );
}

function EmptySlot({ position }: { readonly position: number }): JSX.Element {
  return (
    <li
      aria-hidden="true"
      className="rounded-control border-line text-muted grid min-h-10 place-items-center border border-dashed font-mono text-[0.65rem]"
    >
      {String(position).padStart(2, "0")}
    </li>
  );
}

function Shared({ party }: { readonly party: readonly string[] }): JSX.Element {
  const shared = useSharedWeathers(party);
  return (
    <p className="font-display text-muted text-sm italic">
      {shared.length > 0
        ? `All of them help with ${shared.join(" and ")}`
        : "No weather shared yet"}
    </p>
  );
}

function Slots({ members }: { readonly members: readonly Species[] }): JSX.Element {
  const workbench = useWorkbench();
  const empty = Array.from(
    { length: Math.max(PARTY_SIZE - members.length, 0) },
    (_, index) => members.length + index + 1,
  );
  return (
    <ul className="grid grid-cols-3 gap-1.5">
      {members.map((member) => (
        <Member
          key={member.name}
          member={member}
          onRemove={() => {
            workbench.remove(member.name);
          }}
        />
      ))}
      {empty.map((position) => (
        <EmptySlot key={position} position={position} />
      ))}
    </ul>
  );
}

/** Up to six Pokémon kept across searches, with the weathers they share (SYS-UI-013). */
export function PartyDock(): JSX.Element | null {
  const workbench = useWorkbench();
  const party = workbench.workbench.party;
  const members = useContenders(party);
  if (party.length === 0 && workbench.pending === null) return null;
  return (
    <section aria-label="Party" className="plate pointer-events-auto space-y-2 p-3 sm:p-4">
      <div className="border-line flex items-baseline justify-between gap-3 border-b pb-2">
        <h2 className="flex items-baseline gap-2">
          <span className="font-display text-xl font-semibold">Party</span>{" "}
          <span className="catalogue text-muted tabular-nums">
            {party.length}/{PARTY_SIZE}
          </span>
        </h2>
        <Button
          variant="quiet"
          size="small"
          isDisabled={party.length === 0}
          onPress={workbench.clear}
        >
          Clear the party
        </Button>
      </div>
      <Shared party={party} />
      <Slots members={members} />
      {workbench.pending === null ? null : (
        <ReplacePrompt newcomer={workbench.pending} members={members} />
      )}
    </section>
  );
}
