import guideFile from "./guide.json";
import { GUIDE_TITLES, type GuideSectionId, isSectionId } from "./section";

interface GuideTerm {
  readonly text: string;
  readonly role: string;
}

export interface GuideCheck {
  readonly plan: Readonly<Record<string, unknown>>;
  readonly terms: readonly GuideTerm[];
}

export interface GuideExample {
  readonly query: string;
  readonly label: string;
}

export interface GuideMiss {
  readonly query: string;
  readonly reason: string;
  readonly say: string;
}

export interface GuideSectionContent {
  readonly id: GuideSectionId;
  readonly title: string;
  readonly lead: string;
  readonly pattern: string;
  readonly examples: readonly GuideExample[];
  readonly misses: readonly GuideMiss[];
}

export interface GuideTip {
  readonly text: string;
  readonly query: string;
}

export interface QueryGuideContent {
  readonly checks: Readonly<Record<string, GuideCheck>>;
  readonly sections: readonly GuideSectionContent[];
  readonly tips: readonly GuideTip[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isTerm(value: unknown): value is GuideTerm {
  return isRecord(value) && isString(value["text"]) && isString(value["role"]);
}

function isCheck(value: unknown): value is GuideCheck {
  return (
    isRecord(value) &&
    isRecord(value["plan"]) &&
    Array.isArray(value["terms"]) &&
    value["terms"].every(isTerm)
  );
}

function isExample(value: unknown): value is GuideExample {
  return isRecord(value) && isString(value["query"]) && isString(value["label"]);
}

function isMiss(value: unknown): value is GuideMiss {
  return (
    isRecord(value) &&
    isString(value["query"]) &&
    isString(value["reason"]) &&
    isString(value["say"])
  );
}

function isSection(value: unknown): value is GuideSectionContent {
  if (!isRecord(value) || !isSectionId(value["id"])) return false;
  if (value["title"] !== GUIDE_TITLES[value["id"]]) return false;
  if (!isString(value["lead"]) || !isString(value["pattern"])) return false;
  return (
    Array.isArray(value["examples"]) &&
    value["examples"].every(isExample) &&
    Array.isArray(value["misses"]) &&
    value["misses"].every(isMiss)
  );
}

function isTip(value: unknown): value is GuideTip {
  return isRecord(value) && isString(value["text"]) && isString(value["query"]);
}

function isQueryGuide(value: unknown): value is QueryGuideContent {
  if (!isRecord(value) || !isRecord(value["checks"])) return false;
  if (!Array.isArray(value["sections"]) || !Array.isArray(value["tips"])) return false;
  return (
    Object.values(value["checks"]).every(isCheck) &&
    value["sections"].every(isSection) &&
    value["tips"].every(isTip)
  );
}

/** The guide, checked against the shape the panel renders. */
export function loadGuide(): QueryGuideContent {
  if (!isQueryGuide(guideFile)) throw new Error("Query guide content is invalid.");
  return guideFile;
}

export function guideCheck(checks: QueryGuideContent["checks"], query: string): GuideCheck {
  const check = checks[query];
  if (check === undefined) throw new Error(`Query guide has no reading for "${query}".`);
  return check;
}

/** Type names on a published plan, used to draw the type glyphs beside an example. */
export function planTypes(plan: Readonly<Record<string, unknown>>): readonly string[] {
  const types = plan["types"];
  if (!Array.isArray(types)) return [];
  return types.filter((item): item is string => typeof item === "string");
}
