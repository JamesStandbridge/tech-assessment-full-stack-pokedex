import type { JSX } from "react";

import type { Notice, Refinement, SearchResponse, Term } from "../../api/contract";
import { readingNames } from "../../domain/reading";
import { meaningfulTerms, termTone } from "../../domain/terms";
import { Button } from "../../ui/Button";
import { toneColor } from "../colors";

interface UnderstandingProps {
  readonly response: SearchResponse;
  readonly onRun: (query: string) => void;
}

function Gloss({ term }: { readonly term: Term }): JSX.Element {
  const ignored = term.role === "ignored";
  return (
    <li className="flex flex-col">
      <span
        className={`font-serif text-xl italic underline decoration-2 underline-offset-[7px] ${
          ignored ? "text-ink-soft line-through decoration-dotted" : ""
        }`}
        style={{ textDecorationColor: toneColor(termTone(term.role)) }}
      >
        {term.text}
      </span>
      <span className="label text-ink-soft mt-1.5">
        {ignored ? "ignored" : <span className="sr-only">understood as </span>}
        {ignored ? null : term.role}
      </span>
    </li>
  );
}

/** The query as an interlinear gloss: every word with the role it was read in. */
export function Terms({ response }: { readonly response: SearchResponse }): JSX.Element | null {
  const terms = meaningfulTerms(response.terms);
  if (terms.length === 0) return null;
  return (
    <ul aria-label="How the query was understood" className="flex flex-wrap gap-x-6 gap-y-4">
      {terms.map((term, position) => (
        <Gloss key={`${term.text}-${String(position)}`} term={term} />
      ))}
    </ul>
  );
}

function Notices({ notices }: { readonly notices: readonly Notice[] }): JSX.Element | null {
  if (notices.length === 0) return null;
  return (
    <ul aria-label="Notices" className="space-y-2 text-sm italic">
      {notices.map((notice) => (
        <li key={notice.code} className="border-rubric border-l-2 pl-3">
          {notice.message}
        </li>
      ))}
    </ul>
  );
}

function Refinements(props: {
  readonly refinements: readonly Refinement[];
  readonly onRun: (query: string) => void;
}): JSX.Element | null {
  if (props.refinements.length === 0) return null;
  return (
    <nav aria-label="Refine the search">
      <p className="label text-ink-soft mb-1">Refine</p>
      <ul className="space-y-1">
        {props.refinements.map((refinement) => (
          <li key={`${refinement.action}:${refinement.constraint}`}>
            <Button
              variant="link"
              onPress={() => {
                props.onRun(refinement.query);
              }}
            >
              {refinement.label}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Marginal notes on the query: its readings, notices and refinements (SYS-UI-005 to 019). */
export function Understanding({ response, onRun }: UnderstandingProps): JSX.Element {
  const readings = readingNames(response);
  return (
    <div className="space-y-5 text-sm">
      {readings.length > 0 ? (
        <div>
          <p className="label text-ink-soft mb-1">Read as</p>
          <ul aria-label="Readings" className="space-y-1 italic">
            {readings.map((reading) => (
              <li key={reading}>{reading}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <Notices notices={response.notices} />
      <Refinements refinements={response.refinements} onRun={onRun} />
    </div>
  );
}
