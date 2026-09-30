import { type JSX, useEffect, useRef } from "react";

import type { Species } from "../../api/contract";
import { type Replacement, replacements, signed } from "../../domain/bench";
import { displayName } from "../../domain/entities";
import { Button } from "../../ui/Button";
import { useContenders } from "./data";
import { useWorkbench } from "./WorkbenchContext";

function listed(types: readonly string[]): string {
  return types.length === 0 ? "nothing" : types.join(" and ");
}

/** The trade of one replacement, such as "Speed +35, HP -10; gains rock; loses nothing". */
function tradeOf(replacement: Replacement): string {
  const stats = replacement.differences
    .map((change) => `${change.label} ${signed(change.difference)}`)
    .join(", ");
  return [
    stats === "" ? "Same stats" : stats,
    `gains ${listed(replacement.gains)}`,
    `loses ${listed(replacement.losses)}`,
  ].join("; ");
}

function Option(props: {
  readonly replacement: Replacement;
  readonly newcomer: string;
}): JSX.Element {
  const { replace } = useWorkbench();
  const { replacement, newcomer } = props;
  return (
    <li data-replacement={replacement.member}>
      <Button
        variant="outline"
        onPress={() => {
          replace(replacement.member, newcomer);
        }}
      >
        Replace {displayName(replacement.member)} with {displayName(newcomer)}
      </Button>
      <p className="text-muted px-2 text-xs">{tradeOf(replacement)}</p>
    </li>
  );
}

/** A full party asks whom the newcomer replaces, with what each choice gains and loses (SYS-UI-029). */
export function ReplacePrompt(props: {
  readonly newcomer: string;
  readonly members: readonly Species[];
}): JSX.Element {
  const { cancelReplacement } = useWorkbench();
  const groupRef = useRef<HTMLDivElement>(null);
  const [newcomer] = useContenders([props.newcomer]);
  const name = displayName(props.newcomer);
  useEffect(() => {
    groupRef.current?.focus();
  }, []);
  return (
    <div
      ref={groupRef}
      role="group"
      aria-label={`Replace whom with ${name}?`}
      tabIndex={-1}
      className="border-line space-y-2 border-t pt-2 outline-none"
    >
      <p className="text-sm font-semibold">The party is full. Replace whom with {name}?</p>
      <ul className="space-y-1">
        {newcomer === undefined
          ? null
          : replacements(props.members, newcomer).map((replacement) => (
              <Option
                key={replacement.member}
                replacement={replacement}
                newcomer={props.newcomer}
              />
            ))}
      </ul>
      <Button variant="quiet" onPress={cancelReplacement}>
        Keep the party
      </Button>
    </div>
  );
}
