import { type JSX, type ReactNode, useId } from "react";

import type { EntityRef, Result } from "../../api/contract";
import { assertNever } from "../../domain/assertNever";
import { displayName, refKey, refOf, resultSummary } from "../../domain/entities";
import { Button } from "../../ui/Button";
import { TypeBadge } from "../../ui/TypeBadge";
import { WorkbenchActions } from "../workbench/WorkbenchActions";
import type { Decoration } from "./decorations";
import { EntryPlate } from "./EntryPlate";
import { Why } from "./Why";

interface ResultCardProps {
  readonly result: Result;
  readonly onOpen: (ref: EntityRef) => void;
  /** Words of the query to emphasise where the reasons echo them. */
  readonly emphasis: readonly string[];
  /** What the view adds: its metric, its action and the reasons they make redundant. */
  readonly decorate?: Decoration;
  /** Every result shown beside this one, which the metric may scale against. */
  readonly shown: readonly Result[];
}

function types(result: Result): readonly string[] {
  switch (result.kind) {
    case "pokemon":
      return result.types;
    case "move":
      return [result.type];
    case "ability":
      return [];
    default:
      return assertNever(result);
  }
}

function Heading(props: {
  readonly result: Result;
  readonly titleId: string;
  readonly onOpen: (ref: EntityRef) => void;
}): JSX.Element {
  const { result, titleId, onOpen } = props;
  return (
    <div className="flex min-w-0 items-baseline gap-2">
      <h3 className="font-display min-w-0 truncate text-xl leading-tight font-semibold">
        <Button
          id={titleId}
          variant="link"
          size="inline"
          onPress={() => {
            onOpen(refOf(result));
          }}
        >
          {displayName(result.name)}
        </Button>
      </h3>
      <span className="text-muted shrink-0 font-mono text-[0.6875rem] tabular-nums">
        No. {String(result.id).padStart(3, "0")}
      </span>
    </div>
  );
}

function Subtitle({ result }: { readonly result: Result }): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <p className="text-muted text-sm first-letter:uppercase">{resultSummary(result)}</p>
      {types(result).map((type) => (
        <TypeBadge key={type} type={type} />
      ))}
    </div>
  );
}

function Actions(props: {
  readonly result: Result;
  readonly extra: ReactNode;
}): JSX.Element | null {
  const { result, extra } = props;
  if (result.kind !== "pokemon" && extra === null) return null;
  return (
    <div className="ml-auto flex shrink-0 flex-wrap justify-end gap-1.5">
      {result.kind === "pokemon" ? <WorkbenchActions name={result.name} /> : null}
      {extra}
    </div>
  );
}

/** One result: its name opens the details, and its reasons say why it matched (SYS-UI-020). */
export function ResultCard(props: ResultCardProps): JSX.Element {
  const { result, onOpen, emphasis, decorate, shown } = props;
  const titleId = useId();
  const metric = decorate?.metric(result, shown) ?? null;
  return (
    <article
      aria-labelledby={titleId}
      data-result={refKey(refOf(result))}
      tabIndex={-1}
      className="group/entry rounded-control focus-visible:ring-accent flex gap-3.5 py-3.5 outline-none focus-visible:ring-2"
    >
      <EntryPlate result={result} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="space-y-1">
          <Heading result={result} titleId={titleId} onOpen={onOpen} />
          <Subtitle result={result} />
        </div>
        {metric}
        <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
          <Why
            result={result}
            covers={decorate?.covers ?? []}
            emphasis={emphasis}
            onOpen={onOpen}
          />
          <Actions result={result} extra={decorate?.action?.(result) ?? null} />
        </div>
      </div>
    </article>
  );
}
