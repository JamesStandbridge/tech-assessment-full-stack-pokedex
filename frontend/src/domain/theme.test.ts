import { describe, expect, it } from "vitest";

import { parsePreference, resolveTheme } from "./theme";

describe("parsePreference", () => {
  it.each(["system", "light", "dark"] as const)("keeps the stored %s", (stored) => {
    expect(parsePreference(stored)).toBe(stored);
  });

  it.each([null, "", "sepia", "Light"])("falls back to the system for %s", (stored) => {
    expect(parsePreference(stored)).toBe("system");
  });
});

describe("resolveTheme", () => {
  it("follows the system when the user chose it", () => {
    expect(resolveTheme({ preference: "system", system: "light" })).toBe("light");
    expect(resolveTheme({ preference: "system", system: "dark" })).toBe("dark");
  });

  it("keeps an explicit choice whatever the system prefers", () => {
    expect(resolveTheme({ preference: "light", system: "dark" })).toBe("light");
    expect(resolveTheme({ preference: "dark", system: "light" })).toBe("dark");
  });
});
