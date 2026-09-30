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
      className="bg-panel-raised flex items-center rounded-full pr-1"
    >
      <RemoteImage src={props.member.sprite_url} alt={name} size={36} />
      <span className="pr-1 text-xs">{name}</span>
      <Button variant="quiet" size="small" aria-label={`Remove ${name}`} onPress={props.onRemove}>
        <span aria-hidden="true">x</span>
      </Button>
    </li>
  );
}

function Shared({ party }: { readonly party: readonly string[] }): JSX.Element {
  const shared = useSharedWeathers(party);
  return (
    <p className="text-muted text-xs">
      {shared.length > 0
        ? `All of them help with ${shared.join(" and ")}`
        : "No weather shared yet"}
    </p>
  );
}

/** Up to six Pokémon kept across searches, with the weathers they share (SYS-UI-013). */
export function PartyDock(): JSX.Element | null {
  const workbench = useWorkbench();
  const party = workbench.workbench.party;
  const members = useContenders(party);
  if (party.length === 0 && workbench.pending === null) return null;
  return (
    <section aria-label="Party" className="panel pointer-events-auto space-y-2 rounded-2xl p-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">
          Party {party.length}/{PARTY_SIZE}
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
      <ul className="flex flex-wrap gap-1.5">
        {members.map((member) => (
          <Member
            key={member.name}
            member={member}
            onRemove={() => {
              workbench.remove(member.name);
            }}
          />
        ))}
      </ul>
      {workbench.pending === null ? null : (
        <ReplacePrompt newcomer={workbench.pending} members={members} />
      )}
    </section>
  );
}
