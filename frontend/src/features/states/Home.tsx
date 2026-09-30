import { type JSX, useId } from "react";

import { Button } from "../../ui/Button";

interface Question {
  readonly title: string;
  readonly example: string;
}

const QUESTIONS: readonly Question[] = [
  { title: "Recover a name", example: "bulba" },
  { title: "Compare by criteria", example: "fast electric pokemon" },
  { title: "Discover by effect", example: "put the opponent to sleep" },
  { title: "Explore a strategy", example: "rain team" },
];

function Example(props: {
  readonly question: Question;
  readonly onRun: (query: string) => void;
}): JSX.Element {
  const descriptionId = useId();
  const { question, onRun } = props;
  return (
    <li>
      <Button
        variant="outline"
        size="small"
        aria-describedby={descriptionId}
        onPress={() => {
          onRun(question.example);
        }}
      >
        <span className="whitespace-nowrap">{question.example}</span>
      </Button>
      <span id={descriptionId} hidden>
        {question.title}
      </span>
    </li>
  );
}

/**
 * The four supported kinds of question, each an example that runs, set under
 * the command field so the sky stays the subject of the page (SYS-UI-004).
 */
export function Home({ onRun }: { readonly onRun: (query: string) => void }): JSX.Element {
  return (
    <div className="pointer-events-auto -mx-3 mt-2 flex items-center gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:mt-2.5 sm:px-0">
      <span aria-hidden="true" className="catalogue text-muted shrink-0">
        Try
      </span>
      <ul aria-label="Examples" className="flex shrink-0 gap-1.5">
        {QUESTIONS.map((question) => (
          <Example key={question.title} question={question} onRun={onRun} />
        ))}
      </ul>
    </div>
  );
}
