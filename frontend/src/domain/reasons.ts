import type { EntityRef, Reason, Result, WeatherRole } from "../api/contract";

type ReasonTone = WeatherRole | "neutral";

export interface ReasonModel {
  readonly text: string;
  readonly related: EntityRef | null;
  readonly tone: ReasonTone;
  readonly chance: number | null;
}

const PERCENT = 100;

export function reasonModel(reason: Reason): ReasonModel {
  return {
    text: reason.detail,
    related: reason.related,
    tone: reason.weather_role ?? "neutral",
    chance: reason.probability,
  };
}

/** Format a probability as a whole percentage, keeping small chances visible. */
export function formatChance(probability: number): string {
  const percent = probability * PERCENT;
  if (percent > 0 && percent < 1) {
    return "<1%";
  }
  return `${String(Math.round(percent))}%`;
}

/** Return the chance of the effect a result achieves, from its first effect reason. */
export function effectChance(result: Result): number | null {
  return result.reasons.find((reason) => reason.type === "effect")?.probability ?? null;
}

/** Return the weather role of a result, from its first weather reason. */
export function weatherRole(result: Result): WeatherRole | null {
  return result.reasons.find((reason) => reason.weather_role !== null)?.weather_role ?? null;
}
