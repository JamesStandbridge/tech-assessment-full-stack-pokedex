import type { JSX } from "react";

import type { EntityRef, Reason, Result } from "../../api/contract";
import { displayName } from "../../domain/entities";
import { reasonModel } from "../../domain/reasons";
import { Button } from "../../ui/Button";

interface Segment {
  /** Where the segment starts in the text. */
  readonly at: number;
  readonly text: string;
  readonly emphasised: boolean;
}

interface Split {
  readonly before: string;
  /** The name as the text writes it. */
  readonly name: string;
  readonly after: string;
}

interface WhyProps {
  readonly result: Result;
  /** Kinds of reason the entry already shows, as badges or as its metric. */
  readonly covers: readonly Reason["type"][];
  readonly emphasis: readonly string[];
  readonly onOpen: (ref: EntityRef) => void;
}

function escaped(word: string): string {
  return word.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

/** The text cut around the words of the query, whole words only and ignoring case. */
export function segments(text: string, words: readonly string[]): readonly Segment[] {
  const usable = words.filter((word) => word.trim().length > 1).map(escaped);
  if (usable.length === 0) return [{ at: 0, text, emphasised: false }];
  const pattern = new RegExp(`\\b(${usable.join("|")})\\b`, "giu");
  let at = 0;
  return text
    .split(pattern)
    .map((part, index) => {
      const segment = { at, text: part, emphasised: index % 2 === 1 };
      at += part.length;
      return segment;
    })
    .filter((segment) => segment.text !== "");
}

function Emphasised(props: {
  readonly text: string;
  readonly words: readonly string[];
}): JSX.Element {
  return (
    <>
      {segments(props.text, props.words).map((segment) =>
        segment.emphasised ? (
          <em key={segment.at} className="text-text font-medium not-italic">
            {segment.text}
          </em>
        ) : (
          segment.text
        ),
      )}
    </>
  );
}

/** The text around the name of the related entity, when the text mentions it. */
function around(text: string, related: EntityRef): Split | null {
  const name = displayName(related.name).toLowerCase();
  const at = text.toLowerCase().indexOf(name);
  if (at === -1) return null;
  const end = at + name.length;
  return { before: text.slice(0, at), name: text.slice(at, end), after: text.slice(end) };
}

function ReasonText(props: {
  readonly reason: Reason;
  readonly words: readonly string[];
  readonly onOpen: (ref: EntityRef) => void;
}): JSX.Element {
  const { text, related } = reasonModel(props.reason);
  if (related === null) return <Emphasised text={text} words={props.words} />;
  const label = displayName(related.name);
  const split = around(text, related) ?? { before: `${text} `, name: label, after: "" };
  return (
    <>
      <Emphasised text={split.before} words={props.words} />
      <Button
        variant="link"
        size="inline"
        aria-label={label}
        onPress={() => {
          props.onOpen(related);
        }}
      >
        {split.name}
      </Button>
      <Emphasised text={split.after} words={props.words} />
    </>
  );
}

function shownReasons(result: Result, covers: readonly Reason["type"][]): readonly Reason[] {
  const hidden = new Set<Reason["type"]>(
    result.kind === "ability" ? covers : [...covers, "type-filter"],
  );
  const seen = new Set<string>();
  return result.reasons.filter((reason) => {
    if (hidden.has(reason.type) || seen.has(reason.detail)) return false;
    seen.add(reason.detail);
    return true;
  });
}

/** Why a result matches, on one line, without what its badges and its metric already say. */
export function Why({ result, covers, emphasis, onOpen }: WhyProps): JSX.Element | null {
  const reasons = shownReasons(result, covers);
  if (reasons.length === 0) return null;
  return (
    <ul
      aria-label="Why it matches"
      className="text-muted flex min-w-0 flex-1 basis-40 flex-wrap gap-x-2 text-[0.8125rem] leading-snug"
    >
      {reasons.map((reason) => (
        <li
          key={`${reason.type}:${reason.detail}`}
          className="not-first:before:text-rule not-first:before:mr-2 not-first:before:content-['·']"
        >
          <ReasonText reason={reason} words={emphasis} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  );
}
