import type { JSX } from "react";

import { displayName } from "../../domain/entities";
import { BENCH_SIZE } from "../../domain/workbench";
import { Button } from "../../ui/Button";
import { useWorkbench } from "./WorkbenchContext";

const ICONS = {
  add: "M8 3.5v9M3.5 8h9",
  held: "M3.5 8.5 6.5 11.5 12.5 4.5",
  compare: "M5 3v10M11 3v10M2.5 6.5h5M8.5 9.5h5",
} as const;

function Icon({ path }: { readonly path: string }): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5 shrink-0"
    >
      <path d={path} />
    </svg>
  );
}

/** Put a Pokémon of the results in the party or on the bench; a full party asks whom to replace. */
export function WorkbenchActions({ name }: { readonly name: string }): JSX.Element {
  const workbench = useWorkbench();
  const { party, bench } = workbench.workbench;
  const label = displayName(name);
  const inParty = party.includes(name);
  const onBench = bench.includes(name);
  return (
    <>
      <Button
        variant="hairline"
        size="tight"
        isDisabled={inParty}
        aria-label={inParty ? "In the party" : `Add ${label} to the party`}
        onPress={() => {
          workbench.add(name);
        }}
      >
        <Icon path={inParty ? ICONS.held : ICONS.add} />
        {inParty ? "In the party" : "Party"}
      </Button>
      <Button
        variant="hairline"
        size="tight"
        isDisabled={onBench || bench.length >= BENCH_SIZE}
        aria-label={onBench ? "On the bench" : `Compare ${label} on the bench`}
        onPress={() => {
          workbench.compare(name);
        }}
      >
        <Icon path={onBench ? ICONS.held : ICONS.compare} />
        {onBench ? "On the bench" : "Bench"}
      </Button>
    </>
  );
}
