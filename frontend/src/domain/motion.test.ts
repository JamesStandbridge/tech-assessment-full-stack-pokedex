import { describe, expect, it } from "vitest";

import {
  fallbackApplies,
  parseMotionPreference,
  resolveMotion,
  resolveRenderer,
  type MotionFallback,
  type MotionPreference,
  type RendererConditions,
} from "./motion";

describe("parseMotionPreference", () => {
  it.each(["system", "animated", "still"] as const)("keeps the stored %s", (stored) => {
    expect(parseMotionPreference(stored)).toBe(stored);
  });

  it.each([null, "", "full", "Animated"])("falls back to the system for %s", (stored) => {
    expect(parseMotionPreference(stored)).toBe("system");
  });
});

describe("resolveMotion", () => {
  it("follows the system when the user chose it", () => {
    expect(resolveMotion({ preference: "system", systemReduced: true })).toBe("reduced");
    expect(resolveMotion({ preference: "system", systemReduced: false })).toBe("full");
  });

  it("keeps an explicit choice whatever the system prefers", () => {
    expect(resolveMotion({ preference: "animated", systemReduced: true })).toBe("full");
    expect(resolveMotion({ preference: "animated", systemReduced: false })).toBe("full");
    expect(resolveMotion({ preference: "still", systemReduced: true })).toBe("reduced");
    expect(resolveMotion({ preference: "still", systemReduced: false })).toBe("reduced");
  });
});

function conditions(patch: Partial<RendererConditions>): RendererConditions {
  return {
    preference: "system",
    systemReduced: false,
    savesData: false,
    capable: true,
    fallen: false,
    ...patch,
  };
}

describe("resolveRenderer", () => {
  it("forces the still map when the user asked for it", () => {
    expect(resolveRenderer(conditions({ preference: "still" }))).toBe("still");
  });

  it("draws the scene for animated when the browser can, ignoring reduced motion and data", () => {
    expect(
      resolveRenderer(conditions({ preference: "animated", systemReduced: true, savesData: true })),
    ).toBe("scene");
  });

  it.each([
    { capable: false, fallen: false },
    { capable: true, fallen: true },
  ])("keeps the still map for animated when the drawing cannot run (%o)", (patch) => {
    expect(resolveRenderer(conditions({ preference: "animated", ...patch }))).toBe("still");
  });

  it.each<Partial<RendererConditions>>([
    { systemReduced: true },
    { savesData: true },
    { capable: false },
    { fallen: true },
  ])("keeps today's still map for the system when %o", (patch) => {
    expect(resolveRenderer(conditions(patch))).toBe("still");
  });

  it("draws the scene for the system when nothing blocks it", () => {
    expect(resolveRenderer(conditions({ preference: "system" }))).toBe("scene");
  });
});

describe("fallbackApplies", () => {
  const animated: MotionFallback = { preference: "animated", revision: 2, held: true };

  it("does not apply without a latch or when the preference changed", () => {
    expect(fallbackApplies(null, { preference: "animated", revision: 2 })).toBe(false);
    expect(fallbackApplies({ ...animated, held: false }, animated)).toBe(false);
    expect(fallbackApplies(animated, { preference: "system", revision: 2 })).toBe(false);
  });

  it("lets choosing animated again clear the latch, and holds the others", () => {
    expect(fallbackApplies(animated, animated)).toBe(true);
    expect(fallbackApplies(animated, { preference: "animated", revision: 3 })).toBe(false);
    const preferences: readonly MotionPreference[] = ["system", "still"];
    for (const preference of preferences) {
      expect(
        fallbackApplies({ preference, revision: 1, held: true }, { preference, revision: 4 }),
      ).toBe(true);
    }
  });
});
