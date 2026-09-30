import type { JSX } from "react";

import { Button } from "../../../ui/Button";
import type { GuideMiss } from "./content";

function Miss(props: {
  readonly miss: GuideMiss;
  readonly onRun: (query: string) => void;
}): JSX.Element {
  const { miss, onRun } = props;
  return (
    <li className="border-rule border-l-2 pl-3">
      <p className="text-sm">
        <span className="font-medium">{miss.query}</span>{" "}
        <span className="text-muted">{miss.reason}</span>
      </p>
      <p className="text-muted mt-1.5 text-sm">
        Say{" "}
        <Button
          variant="link"
          size="inline"
          onPress={() => {
            onRun(miss.say);
          }}
        >
          {miss.say}
        </Button>{" "}
        instead.
      </p>
    </li>
  );
}

export function GuideMisses(props: {
  readonly misses: readonly GuideMiss[];
  readonly onRun: (query: string) => void;
}): JSX.Element {
  return (
    <div>
      <h4 className="catalogue text-muted mb-2">Not understood</h4>
      <ul aria-label="Not understood" className="space-y-3">
        {props.misses.map((miss) => (
          <Miss key={miss.query} miss={miss} onRun={props.onRun} />
        ))}
      </ul>
    </div>
  );
}
