import type { JSX } from "react";

import { Button } from "../../../ui/Button";
import type { GuideTip } from "./content";

function Tip(props: {
  readonly tip: GuideTip;
  readonly onRun: (query: string) => void;
}): JSX.Element {
  const { tip, onRun } = props;
  return (
    <li className="space-y-1.5">
      <p className="text-muted text-sm">{tip.text}</p>
      <Button
        variant="outline"
        size="small"
        onPress={() => {
          onRun(tip.query);
        }}
      >
        {tip.query}
      </Button>
    </li>
  );
}

export function GuideTips(props: {
  readonly tips: readonly GuideTip[];
  readonly onRun: (query: string) => void;
}): JSX.Element {
  return (
    <section aria-labelledby="guide-tips" className="space-y-3">
      <h3 id="guide-tips" className="font-display text-2xl leading-tight font-semibold">
        Tips
      </h3>
      <ul className="space-y-3">
        {props.tips.map((tip) => (
          <Tip key={tip.query} tip={tip} onRun={props.onRun} />
        ))}
      </ul>
    </section>
  );
}
