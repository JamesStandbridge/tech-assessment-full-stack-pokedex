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

const NUMERALS = ["I", "II", "III", "IV"] as const;

function QuestionPlate(props: {
  readonly question: Question;
  readonly numeral: string;
  readonly onRun: (query: string) => void;
}): JSX.Element {
  const headingId = useId();
  const { question, numeral, onRun } = props;
  return (
    <section
      aria-labelledby={headingId}
      className="plate pointer-events-auto flex flex-col p-3 sm:p-4"
    >
      <p aria-hidden="true" className="catalogue text-muted flex items-baseline gap-2">
        <span className="text-accent">Pl. {numeral}</span>
        <span className="leader flex-1" />
      </p>
      <h2
        id={headingId}
        className="font-display mt-1.5 text-lg leading-tight font-semibold sm:text-xl"
      >
        {question.title}
      </h2>
      <p className="text-muted mt-1 mb-3 hidden flex-1 text-xs leading-relaxed sm:block">
        {question.description}
      </p>
      <Button
        variant="outline"
        size="small"
        onPress={() => {
          onRun(question.example);
        }}
      >
        <span aria-hidden="true" className="text-accent font-mono">
          &gt;
        </span>
        {question.example}
      </Button>
    </section>
  );
}

/** The four supported kinds of question, each with an example that runs (SYS-UI-004). */
export function Home({ onRun }: { readonly onRun: (query: string) => void }): JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 space-y-3 p-3 sm:space-y-4 sm:p-6">
      <p className="font-display text-muted bg-ink/80 mx-auto w-fit max-w-xl px-3 text-center text-base text-balance italic sm:text-lg">
        The 151 species, placed by likeness of stats and types. Ask a question and the sky
        rearranges around the answer.
      </p>
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {QUESTIONS.map((question, index) => (
          <QuestionPlate
            key={question.title}
            question={question}
            numeral={NUMERALS[index] ?? String(index + 1)}
            onRun={onRun}
          />
        ))}
      </div>
    </div>
  );
}
