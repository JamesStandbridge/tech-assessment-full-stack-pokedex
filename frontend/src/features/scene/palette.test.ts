import { describe, expect, it } from "vitest";

import { printedHex, skyHex } from "./palette";

describe("printedHex", () => {
  it("keeps a colour as it is on the night sky", () => {
    expect(printedHex("#9aa6c4", "dark")).toBe("#9aa6c4");
  });

  it("darkens every channel on the light sky", () => {
    expect(printedHex("#ffffff", "light")).toBe("#8c8c8c");
    expect(printedHex("#ffd23f", "light")).toBe("#8c7423");
  });
});

describe("skyHex", () => {
  it("clears the sky to the ink of each theme", () => {
    expect(skyHex("dark")).toBe("#0b0f1a");
    expect(skyHex("light")).toBe("#f3eee3");
  });
});
