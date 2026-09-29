import { type JSX, type ReactNode, useId } from "react";

import type { EntityRef, Result } from "../../api/contract";
import { assertNever } from "../../domain/assertNever";
import { displayName, refOf, resultSummary } from "../../domain/entities";
import { reasonModel } from "../../domain/reasons";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { RemoteImage } from "../../ui/RemoteImage";
import { typeColor } from "../colors";

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
    <ul aria-label="Why it matches" className="text-muted space-y-1 text-sm">
      {props.result.reasons.map((reason) => {
        const model = reasonModel(reason);
        const related = model.related;
        return (
          <li key={`${reason.type}:${reason.detail}`} className="flex flex-wrap items-center gap-2">
            <span>{model.text}</span>
            {related === null ? null : (
              <Button
                variant="outline"
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

/** One result: its name opens the details, and its reasons say why it matched (SYS-UI-020). */
export function ResultCard({ result, onOpen, children }: ResultCardProps): JSX.Element {
  const titleId = useId();
  const name = displayName(result.name);
  return (
    <article
      aria-labelledby={titleId}
      className="rounded-card border-line bg-panel/80 shadow-glow flex gap-4 border p-4"
    >
      {result.kind === "pokemon" ? (
        <RemoteImage src={result.sprite_url} alt={name} size={72} />
      ) : null}
      <div className="min-w-0 flex-1 space-y-2">
        <h3 className="text-lg font-semibold">
          <Button
            id={titleId}
            variant="quiet"
            onPress={() => {
              onOpen(refOf(result));
            }}
          >
            {name}
          </Button>
        </h3>
        <p className="text-muted text-sm">{resultSummary(result)}</p>
        <div className="flex flex-wrap gap-1">
          {types(result).map((type) => (
            <Chip key={type} label={type} color={typeColor(type)} />
          ))}
        </div>
        {children}
        <Reasons result={result} onOpen={onOpen} />
      </div>
    </article>
  );
}
