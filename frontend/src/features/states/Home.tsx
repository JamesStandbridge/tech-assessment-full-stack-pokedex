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
    <section aria-labelledby={headingId} className="panel pointer-events-auto rounded-2xl p-4">
      <h2 id={headingId} className="text-sm font-semibold">
        {question.title}
      </h2>
      <p className="text-muted mt-1 mb-3 text-xs leading-relaxed">{question.description}</p>
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
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 space-y-4 p-4 sm:p-6">
      <p className="text-muted mx-auto max-w-xl text-center text-sm text-balance">
        The 151 species, placed by likeness of stats and types. Ask a question and the sky
        rearranges around the answer.
      </p>
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 lg:grid-cols-4">
        {QUESTIONS.map((question) => (
          <QuestionCard key={question.title} question={question} onRun={onRun} />
        ))}
      </div>
    </div>
  );
}
