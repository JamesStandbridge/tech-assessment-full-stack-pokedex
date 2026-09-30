import { describe, expect, test } from "vitest";

import type { Result, SearchPlan, SearchResponse } from "../api/contract";
import { bulbaSearch } from "../test/recorded/bulbaSearch";
import { fastElectricSearch } from "../test/recorded/fastElectricSearch";
import { rainTeamSearch } from "../test/recorded/rainTeamSearch";
import { sleepSearch } from "../test/recorded/sleepSearch";
import { speciesList } from "../test/recorded/speciesList";
import { constellation } from "./constellation";
import { ORIGIN } from "./geometry";
import { linkLabel, namedNodes, type SceneFrame, sceneFrame } from "./scene";
import { axisStaging } from "./sceneStaging";
import { circlePositions, type SceneNode } from "./sceneTypes";

const places = constellation(speciesList.species);

function node(frame: SceneFrame, id: string): SceneNode {
  const found = frame.nodes.find((one) => one.id === id);
  if (found === undefined) throw new Error(`no node ${id}`);
  return found;
}

function keeping(response: SearchResponse, keep: (result: Result) => boolean): SearchResponse {
  return {
    ...response,
    sections: response.sections.map((section) => ({
      ...section,
      results: section.results.filter(keep),
    })),
  };
}

function planned(response: SearchResponse, plan: Partial<SearchPlan>): SearchResponse {
  const [first, ...rest] = response.interpretation.alternatives;
  if (first === undefined) throw new Error("no plan");
  return {
    ...response,
    interpretation: { ...response.interpretation, alternatives: [{ ...first, ...plan }, ...rest] },
  };
}

describe("the name reading", () => {
  test("without a best match frames every match, none in front", () => {
    const frame = sceneFrame(places, { ...bulbaSearch, best_match: null });
    expect(frame.layout).toBe("focus");
    expect(frame.nodes.some((one) => one.emphasis === "front")).toBe(false);
    expect(frame.camera.distance).toBeGreaterThan(7);
  });

  test("leaves out of the sky a match it has no place for", () => {
    const sky = new Map([...places].filter(([name]) => name !== "bulbasaur"));
    const frame = sceneFrame(sky, bulbaSearch);
    expect(frame.layout).toBe("focus");
    expect(frame.nodes.some((one) => one.id === "pokemon:bulbasaur")).toBe(false);
    expect(frame.nodes).toHaveLength(150);
  });
});

describe("the criteria reading", () => {
  test("without a sky to scatter lights the results in place", () => {
    expect(sceneFrame(new Map(), fastElectricSearch).layout).toBe("atlas");
  });

  test("without any result measured by the stat lights the results in place", () => {
    const frame = sceneFrame(
      places,
      keeping(fastElectricSearch, () => false),
    );
    expect(frame.layout).toBe("atlas");
    expect(namedNodes(frame)).toEqual([]);
  });

  test("a reading that compares no stat has no axis", () => {
    expect(axisStaging(places, bulbaSearch)).toBeNull();
  });

  test("a single result sits in the middle of the axis", () => {
    const frame = sceneFrame(
      places,
      keeping(fastElectricSearch, (result) => result.rank === 1),
    );
    expect(frame.layout).toBe("axis");
    expect(node(frame, "pokemon:electrode").position.x).toBe(0);
  });

  test("a second compared stat raises the results by that stat", () => {
    const response = planned(fastElectricSearch, {
      stat_sort: [
        { stat: "speed", direction: "desc" },
        { stat: "attack", direction: "desc" },
      ],
    });
    const lit = namedNodes(sceneFrame(places, response));
    const heights = lit.map((one) => one.position.y);
    expect(Math.max(...heights)).toBeCloseTo(6);
    expect(Math.min(...heights)).toBeCloseTo(-6);
  });
});

describe("the effect reading", () => {
  test("a carrier with no hub to hang from waits on a loose circle", () => {
    const frame = sceneFrame(
      places,
      keeping(sleepSearch, (result) => result.kind === "pokemon"),
    );
    const paras = node(frame, "pokemon:paras");
    expect(frame.layout).toBe("hubs");
    expect(frame.links).toEqual([]);
    expect(Math.hypot(paras.position.x, paras.position.y)).toBeCloseTo(16);
  });
});

describe("the weather reading", () => {
  test("without mechanisms links every Pokémon to the weather itself", () => {
    const frame = sceneFrame(
      places,
      keeping(rainTeamSearch, (result) => result.kind === "pokemon"),
    );
    expect(frame.layout).toBe("rings");
    expect(frame.links.length).toBeGreaterThan(0);
    expect(frame.links.every((link) => link.source === "weather:rain")).toBe(true);
  });

  test("a Pokémon with no weather role joins the mixed ring", () => {
    const stripped = rainTeamSearch.sections.map((section) => ({
      ...section,
      results: section.results.map((result) => ({
        ...result,
        reasons: result.reasons.map((reason) => ({ ...reason, weather_role: null, related: null })),
      })),
    }));
    const frame = sceneFrame(places, { ...rainTeamSearch, sections: stripped });
    const pokemon = namedNodes(frame).filter((one) => one.kind === "pokemon");
    expect(pokemon.length).toBeGreaterThan(0);
    expect(pokemon.every((one) => one.ring === "Mixed")).toBe(true);
    expect(frame.rings.map((ring) => ring.name)).toEqual(["Mixed"]);
  });
});

describe("scene helpers", () => {
  test("a link to an unknown node is described by its identifier", () => {
    const frame = sceneFrame(places, null);
    expect(
      linkLabel(frame, { source: "pokemon:pikachu", target: "move:nothing", strength: 1 }),
    ).toBe("Pikachu → move:nothing");
  });

  test("a single result sits on the center of its circle", () => {
    expect(circlePositions(1, 5, { x: 1, y: 2, z: 3 })).toEqual([{ x: 1, y: 2, z: 3 }]);
    expect(circlePositions(0, 5, ORIGIN)).toEqual([]);
  });
});
