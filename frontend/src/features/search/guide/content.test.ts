import { expect, test } from "vitest";

import { loadGuide } from "./content";
import { GUIDE_SECTION_IDS, GUIDE_TITLES } from "./section";

test("the guide is the four readings, and every query it shows is checked", () => {
  const guide = loadGuide();
  expect(guide.sections.map((section) => section.id)).toEqual([...GUIDE_SECTION_IDS]);
  const published = new Set<string>();
  for (const section of guide.sections) {
    expect(section.title).toBe(GUIDE_TITLES[section.id]);
    expect(section.lead.length).toBeGreaterThan(0);
    expect(section.pattern.length).toBeGreaterThan(0);
    expect(section.examples.length).toBeGreaterThanOrEqual(2);
    expect(section.examples.length).toBeLessThanOrEqual(3);
    expect(section.misses.length).toBeGreaterThan(0);
    for (const example of section.examples) published.add(example.query);
    for (const miss of section.misses) {
      expect(miss.reason.length).toBeGreaterThan(0);
      published.add(miss.query);
      published.add(miss.say);
    }
  }
  for (const tip of guide.tips) {
    expect(tip.text.length).toBeGreaterThan(0);
    published.add(tip.query);
  }
  expect(new Set(Object.keys(guide.checks))).toEqual(published);
});
