import type { SearchPlan, SearchResponse } from "../../../api/contract";
import { assertNever } from "../../../domain/assertNever";

export const GUIDE_SECTION_IDS = ["name", "criteria", "effect", "strategy"] as const;

export type GuideSectionId = (typeof GUIDE_SECTION_IDS)[number];

export const GUIDE_TITLES: Readonly<Record<GuideSectionId, string>> = {
  name: "Recover a name",
  criteria: "Compare by criteria",
  effect: "Discover by effect",
  strategy: "Explore a strategy",
};

export function isSectionId(value: unknown): value is GuideSectionId {
  return GUIDE_SECTION_IDS.some((id) => id === value);
}

/** The accessible name of the link that opens the guide on this reading. */
export function guideLinkLabel(section: GuideSectionId | null): string {
  switch (section) {
    case null:
      return "How to ask about this";
    case "name":
      return "How to ask about a name";
    case "criteria":
      return "How to ask about criteria";
    case "effect":
      return "How to ask about an effect";
    case "strategy":
      return "How to ask about a strategy";
    default:
      return assertNever(section);
  }
}

function isBare(plan: SearchPlan): boolean {
  return (
    plan.name === null &&
    plan.dex_number === null &&
    plan.weather === null &&
    plan.effect === null &&
    plan.relation === null &&
    plan.types.length === 0 &&
    plan.characteristics.length === 0 &&
    plan.damage_classes.length === 0 &&
    plan.stat_sort.length === 0 &&
    plan.stat_filters.length === 0
  );
}

/** The guide section a plan belongs in, using the same precedence as the results view. */
function sectionOfPlan(plan: SearchPlan): GuideSectionId {
  if (plan.name !== null || plan.dex_number !== null) return "name";
  if (plan.weather !== null) return "strategy";
  if (plan.effect !== null) return "effect";
  if (plan.stat_sort.length > 0 || plan.stat_filters.length > 0) return "criteria";
  if (plan.relation !== null) return "strategy";
  if (plan.types.length > 0 || plan.damage_classes.length > 0) return "criteria";
  return "name";
}

/** Which part of the guide explains this outcome. Null opens the guide at the top. */
export function guideSection(response: SearchResponse): GuideSectionId | null {
  const plan = response.interpretation.alternatives[0];
  if (plan === undefined || isBare(plan)) return null;
  return sectionOfPlan(plan);
}
