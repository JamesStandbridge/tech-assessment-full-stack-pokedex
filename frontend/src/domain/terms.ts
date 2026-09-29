import type { Term, TermRole } from "../api/contract";

/** Visual family of a term, shared by the term chips and the legend. */
export type TermTone =
  | "entity"
  | "kind"
  | "type"
  | "trait"
  | "stat"
  | "effect"
  | "weather"
  | "relation"
  | "filler"
  | "ignored";

const TONES: Readonly<Record<TermRole, TermTone>> = {
  name: "entity",
  "dex-number": "entity",
  kind: "kind",
  type: "type",
  characteristic: "trait",
  stat: "stat",
  direction: "stat",
  comparator: "stat",
  number: "stat",
  effect: "effect",
  mode: "effect",
  target: "effect",
  weather: "weather",
  relation: "relation",
  filler: "filler",
  ignored: "ignored",
};

export function termTone(role: TermRole): TermTone {
  return TONES[role];
}

/** Return the terms worth showing: every term except fillers. */
export function meaningfulTerms(terms: readonly Term[]): readonly Term[] {
  return terms.filter((term) => term.role !== "filler");
}
