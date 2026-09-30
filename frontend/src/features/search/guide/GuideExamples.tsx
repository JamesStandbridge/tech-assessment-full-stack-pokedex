import { type JSX, useId } from "react";

import { Button } from "../../../ui/Button";
import { TypeBadge } from "../../../ui/TypeBadge";
import { type GuideExample, type QueryGuideContent, guideCheck, planTypes } from "./content";

function Example(props: {
  readonly example: GuideExample;
  readonly checks: QueryGuideContent["checks"];
  readonly onRun: (query: string) => void;
}): JSX.Element {
  const descriptionId = useId();
  const { example, checks, onRun } = props;
  const types = planTypes(guideCheck(checks, example.query).plan);
  return (
    <li className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="small"
        aria-describedby={descriptionId}
        onPress={() => {
          onRun(example.query);
        }}
      >
        {example.query}
      </Button>
      <span id={descriptionId} hidden>
        {example.label}
      </span>
      {types.map((type) => (
        <TypeBadge key={type} type={type} compact />
      ))}
    </li>
  );
}

export function GuideExamples(props: {
  readonly title: string;
  readonly examples: readonly GuideExample[];
  readonly checks: QueryGuideContent["checks"];
  readonly onRun: (query: string) => void;
}): JSX.Element {
  const { title, examples, checks, onRun } = props;
  return (
    <ul aria-label={`${title} examples`} className="flex flex-col items-start gap-2">
      {examples.map((example) => (
        <Example key={example.query} example={example} checks={checks} onRun={onRun} />
      ))}
    </ul>
  );
}
