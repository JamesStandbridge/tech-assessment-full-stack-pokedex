import { type JSX, useId } from "react";

import { Button } from "../../ui/Button";

interface Question {
  readonly title: string;
  readonly description: string;
  readonly example: string;
}

const QUESTIONS: readonly Question[] = [
  {
    title: "Recover a name",
    description: "Type the part you remember, even misspelt.",
    example: "bulba",
  },
  {
    title: "Compare by criteria",
    description: "Combine types, stats and limits, then compare the candidates.",
    example: "fast electric pokemon",
  },
  {
    title: "Discover by effect",
    description:
      "Say what you want to achieve; moves, abilities and Pokémon come with their chances.",
    example: "put the opponent to sleep",
  },
  {
    title: "Explore a strategy",
    description: "Name a weather to see what sets it, what benefits and what suffers.",
    example: "rain team",
  },
];

function QuestionCard(props: {
  readonly question: Question;
  readonly onRun: (query: string) => void;
}): JSX.Element {
  const headingId = useId();
  const { question, onRun } = props;
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-card border-line bg-panel/80 shadow-glow border p-5"
    >
      <h2 id={headingId} className="text-lg font-semibold">
        {question.title}
      </h2>
      <p className="text-muted mt-1 mb-4 text-sm">{question.description}</p>
      <Button
        variant="outline"
        onPress={() => {
          onRun(question.example);
        }}
      >
        {question.example}
      </Button>
    </section>
  );
}

/** The four supported kinds of question, each with an example that runs (SYS-UI-004). */
export function Home({ onRun }: { readonly onRun: (query: string) => void }): JSX.Element {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {QUESTIONS.map((question) => (
        <QuestionCard key={question.title} question={question} onRun={onRun} />
      ))}
    </div>
  );
}
