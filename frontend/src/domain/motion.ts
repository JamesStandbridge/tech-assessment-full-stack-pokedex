import { assertNever } from "./assertNever";

/** How much the interface moves: the animated scene, or a still presentation. */
export type Motion = "full" | "reduced";

/** What the user asked for: motion, stillness, or whatever the operating system prefers. */
export type MotionPreference = "system" | "animated" | "still";

export const MOTION_PREFERENCES: readonly MotionPreference[] = ["system", "animated", "still"];

/** Which renderer draws the constellation: the GPU scene, or the still map (SYS-UI-025). */
export type Renderer = "scene" | "still";

/** A stored preference, read back; anything unknown means the system's. */
export function parseMotionPreference(value: string | null): MotionPreference {
  return MOTION_PREFERENCES.find((preference) => preference === value) ?? "system";
}

export function resolveMotion(choice: {
  readonly preference: MotionPreference;
  readonly systemReduced: boolean;
}): Motion {
  switch (choice.preference) {
    case "system":
      return choice.systemReduced ? "reduced" : "full";
    case "animated":
      return "full";
    case "still":
      return "reduced";
    default:
      return assertNever(choice.preference);
  }
}

export interface RendererConditions {
  readonly preference: MotionPreference;
  readonly systemReduced: boolean;
  readonly savesData: boolean;
  readonly capable: boolean;
  /** The scene already gave way, on a low frame rate or a lost drawing context. */
  readonly fallen: boolean;
}

function systemBlocksScene(conditions: RendererConditions): boolean {
  return (
    conditions.systemReduced || conditions.savesData || !conditions.capable || conditions.fallen
  );
}

/** Still forces the map. Animated ignores reduced motion and reduced data, but not a missing GPU or a failed drawing. */
export function resolveRenderer(conditions: RendererConditions): Renderer {
  switch (conditions.preference) {
    case "still":
      return "still";
    case "animated":
      return conditions.capable && !conditions.fallen ? "scene" : "still";
    case "system":
      return systemBlocksScene(conditions) ? "still" : "scene";
    default:
      return assertNever(conditions.preference);
  }
}

export interface MotionRevision {
  readonly preference: MotionPreference;
  readonly revision: number;
}

export interface MotionFallback extends MotionRevision {
  readonly held: boolean;
}

/**
 * A failed drawing stays until the user leaves that preference.
 * Choosing animated again bumps the revision, so that choice can retry.
 */
export function fallbackApplies(latch: MotionFallback | null, current: MotionRevision): boolean {
  if (latch === null || !latch.held || latch.preference !== current.preference) return false;
  switch (current.preference) {
    case "animated":
      return latch.revision === current.revision;
    case "system":
    case "still":
      return true;
    default:
      return assertNever(current.preference);
  }
}
