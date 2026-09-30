import { type JSX, useId } from "react";

import { Button } from "../../ui/Button";

interface Question {
  readonly plate: string;
  readonly title: string;
  readonly description: string;
  readonly example: string;
}

const QUESTIONS: readonly Question[] = [
  {
    plate: "I",
    title: "Recover a name",
    description: "Write the part you remember, even misspelt, and the atlas finds the specimen.",
    example: "bulba",
  },
  {
    plate: "II",
    title: "Compare by criteria",
    description: "Combine types, stats and limits, then read the candidates on one scale.",
    example: "fast electric pokemon",
  },
  {
    plate: "III",
    title: "Discover by effect",
    description:
      "Say what you want to achieve; moves, abilities and Pokémon come with their chances.",
    example: "put the opponent to sleep",
  },
  {
    plate: "IV",
    title: "Explore a strategy",
    description: "Name a weather to see what sets it, what benefits and what suffers.",
    example: "rain team",
  },
];

function Entry(props: {
  readonly question: Question;
  readonly onRun: (query: string) => void;
}): JSX.Element {
  const headingId = useId();
  const { question, onRun } = props;
  return (
    <section
      aria-labelledby={headingId}
      className="border-rule grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-4 border-t py-5 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:items-baseline"
    >
      <p aria-hidden="true" className="font-display text-rubric text-3xl leading-none">
        {question.plate}
      </p>
      <div>
        <h2 id={headingId} className="text-2xl leading-tight">
          {question.title}
        </h2>
        <p className="text-ink-soft mt-1 max-w-prose italic">{question.description}</p>
      </div>
      <p className="col-start-2 mt-3 flex items-baseline gap-2 sm:col-start-3 sm:mt-0">
        <span className="label text-ink-soft">e.g.</span>
        <Button
          variant="link"
          onPress={() => {
            onRun(question.example);
          }}
        >
          {question.example}
        </Button>
      </p>
    </section>
  );
}

/** The four supported kinds of question, as the contents of the atlas (SYS-UI-004). */
export function Home({ onRun }: { readonly onRun: (query: string) => void }): JSX.Element {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <nav aria-label="Contents">
        <p className="label text-ink-soft mb-2">Contents</p>
        {QUESTIONS.map((question) => (
          <Entry key={question.title} question={question} onRun={onRun} />
        ))}
        <div className="border-ink border-t" />
      </nav>
      <aside className="text-ink-soft text-sm leading-relaxed italic">
        <p className="label mb-2 not-italic">Note on the atlas</p>
        <p>
          Every result states why it answers the question: the move, the ability or the weather it
          was found through. Specimens can be compared on the bench and gathered into a party of
          six, which follows you from one question to the next.
        </p>
      </aside>
    </div>
  );
}
