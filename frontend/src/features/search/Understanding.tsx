import type { JSX } from "react";

import type { Notice, Refinement, SearchResponse } from "../../api/contract";
import { readingNames } from "../../domain/reading";
import { meaningfulTerms, termTone } from "../../domain/terms";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { toneColor } from "../colors";
import { type GuideSectionId, guideLinkLabel, guideSection } from "./guide/section";

interface UnderstandingProps {
  readonly response: SearchResponse;
  readonly onRun: (query: string) => void;
  readonly onOpenGuide: (section: GuideSectionId | null) => void;
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
    <nav aria-label="Refine the search" className="flex flex-wrap items-center gap-1.5">
      <span aria-hidden="true" className="catalogue text-muted mr-1">
        Refine
      </span>
      {props.refinements.map((refinement) => (
        <Button
          key={`${refinement.action}:${refinement.constraint}`}
          variant="hairline"
          size="tight"
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

function ApproximateGuide(props: UnderstandingProps): JSX.Element | null {
  const approximate = props.response.notices.some((notice) => notice.code === "approximate-match");
  if (!approximate || props.response.outcome === "empty") return null;
  const section = guideSection(props.response);
  return (
    <Button
      variant="link"
      size="inline"
      onPress={() => {
        props.onOpenGuide(section);
      }}
    >
      {guideLinkLabel(section)}
    </Button>
  );
}

/** How the query was read: its terms, readings, notices and refinements (SYS-UI-005 to 019). */
export function Understanding({ response, onRun, onOpenGuide }: UnderstandingProps): JSX.Element {
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
      <ApproximateGuide response={response} onRun={onRun} onOpenGuide={onOpenGuide} />
      <Refinements refinements={response.refinements} onRun={onRun} />
    </div>
  );
}
