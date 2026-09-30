import { type JSX, type ReactNode, useId } from "react";

import type { EntityRef, Result } from "../../api/contract";
import { assertNever } from "../../domain/assertNever";
import { displayName, kindLabel, refKey, refOf, resultSummary } from "../../domain/entities";
import { reasonModel } from "../../domain/reasons";
import { Button } from "../../ui/Button";
import { RemoteImage } from "../../ui/RemoteImage";
import { TypeBadge } from "../../ui/TypeBadge";
import { WorkbenchActions } from "../workbench/WorkbenchActions";

interface ResultCardProps {
  readonly result: Result;
  readonly onOpen: (ref: EntityRef) => void;
  /** View-specific content, such as comparison bars or a weather role. */
  readonly children?: ReactNode;
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

function Reasons(props: {
  readonly result: Result;
  readonly onOpen: (ref: EntityRef) => void;
}): JSX.Element {
  return (
    <ul aria-label="Why it matches" className="text-muted space-y-1 text-sm leading-relaxed">
      {props.result.reasons.map((reason) => {
        const model = reasonModel(reason);
        const related = model.related;
        return (
          <li
            key={`${reason.type}:${reason.detail}`}
            className="before:bg-rule flex flex-wrap items-center gap-x-2 gap-y-1 before:size-1 before:rotate-45"
          >
            <span>{model.text}</span>
            {related === null ? null : (
              <Button
                variant="outline"
                size="small"
                onPress={() => {
                  props.onOpen(related);
                }}
              >
                {displayName(related.name)}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** The catalogue number of a result, such as "Pokémon No. 025". */
function catalogueNumber(result: Result): string {
  return `${kindLabel(result.kind, 1)} No. ${String(result.id).padStart(3, "0")}`;
}

function Title(props: {
  readonly result: Result;
  readonly titleId: string;
  readonly onOpen: (ref: EntityRef) => void;
}): JSX.Element {
  const { result, titleId, onOpen } = props;
  return (
    <div>
      <p className="catalogue text-muted">{catalogueNumber(result)}</p>
      <h3 className="font-display text-2xl leading-tight font-semibold">
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
      <p className="text-muted text-sm">{resultSummary(result)}</p>
    </div>
  );
}

/** One result: its name opens the details, and its reasons say why it matched (SYS-UI-020). */
export function ResultCard({ result, onOpen, children }: ResultCardProps): JSX.Element {
  const titleId = useId();
  const name = displayName(result.name);
  return (
    <article
      aria-labelledby={titleId}
      data-result={refKey(refOf(result))}
      tabIndex={-1}
      className="rounded-control focus-visible:ring-accent flex gap-3 py-4 outline-none focus-visible:ring-2"
    >
      <p aria-hidden="true" className="text-muted w-6 shrink-0 pt-1 font-mono text-xs tabular-nums">
        {String(result.rank).padStart(2, "0")}
      </p>
      {result.kind === "pokemon" ? (
        <div className="specimen shrink-0 self-start p-1">
          <RemoteImage src={result.sprite_url} alt={name} size={64} />
        </div>
      ) : null}
      <div className="min-w-0 flex-1 space-y-2">
        <Title result={result} titleId={titleId} onOpen={onOpen} />
        <div className="flex flex-wrap gap-1">
          {types(result).map((type) => (
            <TypeBadge key={type} type={type} />
          ))}
        </div>
        {children}
        {result.kind === "pokemon" ? <WorkbenchActions name={result.name} /> : null}
        <Reasons result={result} onOpen={onOpen} />
      </div>
    </article>
  );
}
