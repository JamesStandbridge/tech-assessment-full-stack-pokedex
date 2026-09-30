import type { JSX } from "react";

import type { Notice, Refinement, SearchResponse } from "../../api/contract";
import { readingNames } from "../../domain/reading";
import { meaningfulTerms, termTone } from "../../domain/terms";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { toneColor } from "../colors";

interface UnderstandingProps {
  readonly response: SearchResponse;
  readonly onRun: (query: string) => void;
}

function Terms({ response }: { readonly response: SearchResponse }): JSX.Element | null {
  const terms = meaningfulTerms(response.terms);
  if (terms.length === 0) return null;
  return (
    <ul aria-label="How the query was understood" className="flex flex-wrap gap-2">
      {terms.map((term, position) => (
        <li key={`${term.text}-${String(position)}`}>
          <Chip
            label={term.text}
            color={toneColor(termTone(term.role))}
            description={term.role === "ignored" ? "ignored" : `understood as ${term.role}`}
            dashed={term.role === "ignored"}
          />
        </li>
      ))}
    </ul>
  );
}

function Notices({ notices }: { readonly notices: readonly Notice[] }): JSX.Element | null {
  if (notices.length === 0) return null;
  return (
    <ul aria-label="Notices" className="text-muted border-rule space-y-1 border-l pl-3 text-sm">
      {notices.map((notice) => (
        <li key={notice.code}>{notice.message}</li>
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
    <nav aria-label="Refine the search" className="flex flex-wrap gap-2">
      {props.refinements.map((refinement) => (
        <Button
          key={`${refinement.action}:${refinement.constraint}`}
          variant="outline"
          size="small"
          onPress={() => {
            props.onRun(refinement.query);
          }}
        >
          {refinement.label}
        </Button>
      ))}
    </nav>
  );
}

/** How the query was read: its terms, readings, notices and refinements (SYS-UI-005 to 019). */
export function Understanding({ response, onRun }: UnderstandingProps): JSX.Element {
  const readings = readingNames(response);
  return (
    <div className="border-line space-y-3 border-b pb-4">
      <Terms response={response} />
      {readings.length > 0 ? (
        <ul aria-label="Readings" className="catalogue text-muted flex flex-wrap gap-x-3">
          {readings.map((reading) => (
            <li key={reading}>Read as {reading}</li>
          ))}
        </ul>
      ) : null}
      <Notices notices={response.notices} />
      <Refinements refinements={response.refinements} onRun={onRun} />
    </div>
  );
}
