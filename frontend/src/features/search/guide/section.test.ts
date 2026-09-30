import { expect, test } from "vitest";

import { bulbaSearch } from "../../../test/recorded/bulbaSearch";
import { emptySearch } from "../../../test/recorded/emptySearch";
import { fastElectricSearch } from "../../../test/recorded/fastElectricSearch";
import { legendarySearch } from "../../../test/recorded/legendarySearch";
import { rainTeamSearch } from "../../../test/recorded/rainTeamSearch";
import { sleepSearch } from "../../../test/recorded/sleepSearch";
import type { SearchResponse } from "../../../api/contract";
import { guideLinkLabel, guideSection } from "./section";

const CASES: readonly (readonly [string, SearchResponse, ReturnType<typeof guideSection>])[] = [
  ["a name", bulbaSearch, "name"],
  ["an unknown name", emptySearch, "name"],
  ["criteria", fastElectricSearch, "criteria"],
  ["an effect", sleepSearch, "effect"],
  ["a weather strategy", rainTeamSearch, "strategy"],
  ["a remembered characteristic", legendarySearch, "name"],
];

test.each(CASES)("%s opens that part of the guide", (_, response, section) => {
  expect(guideSection(response)).toBe(section);
  expect(guideLinkLabel(section).length).toBeGreaterThan(0);
});
