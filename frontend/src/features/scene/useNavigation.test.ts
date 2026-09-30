import { describe, expect, test } from "vitest";

import { constellation } from "../../domain/constellation";
import { type SceneFrame, sceneFrame } from "../../domain/scene";
import { rainTeamSearch } from "../../test/recorded/rainTeamSearch";
import { speciesList } from "../../test/recorded/speciesList";
import { sameSkyView } from "./useNavigation";

const places = constellation(speciesList.species);

function home(): SceneFrame {
  return sceneFrame(places, null);
}

describe("sameSkyView", () => {
  test("two builds of the same sky share a view, a new query does not", () => {
    expect(sameSkyView(home(), home())).toBe(true);
    expect(sameSkyView(home(), sceneFrame(places, rainTeamSearch))).toBe(false);
  });
});
