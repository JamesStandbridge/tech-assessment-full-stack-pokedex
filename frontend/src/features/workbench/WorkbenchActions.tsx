import type { JSX } from "react";

import { displayName } from "../../domain/entities";
import { BENCH_SIZE } from "../../domain/workbench";
import { Button } from "../../ui/Button";
import { useWorkbench } from "./WorkbenchContext";

/** Put a Pokémon of the results in the party or on the bench; a full party asks whom to replace. */
export function WorkbenchActions({ name }: { readonly name: string }): JSX.Element {
  const workbench = useWorkbench();
  const { party, bench } = workbench.workbench;
  const label = displayName(name);
  const inParty = party.includes(name);
  const onBench = bench.includes(name);
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        isDisabled={inParty}
        onPress={() => {
          workbench.add(name);
        }}
      >
        {inParty ? "In the party" : `Add ${label} to the party`}
      </Button>
      <Button
        variant="outline"
        isDisabled={onBench || bench.length >= BENCH_SIZE}
        onPress={() => {
          workbench.compare(name);
        }}
      >
        {onBench ? "On the bench" : `Compare ${label} on the bench`}
      </Button>
    </div>
  );
}
