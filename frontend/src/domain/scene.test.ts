import { describe, expect, test } from "vitest";

import { bulbaSearch } from "../test/recorded/bulbaSearch";
import { fastElectricSearch } from "../test/recorded/fastElectricSearch";
import { psychicSearch } from "../test/recorded/psychicSearch";
import { rainTeamSearch } from "../test/recorded/rainTeamSearch";
import { sleepSearch } from "../test/recorded/sleepSearch";
import { speciesList } from "../test/recorded/speciesList";
import { constellation } from "./constellation";
import { linkLabel, namedNodes, neighbours, type SceneFrame, sceneFrame } from "./scene";
import type { SceneNode } from "./sceneTypes";

const places = constellation(speciesList.species);

function node(frame: SceneFrame, id: string): SceneNode {
  const found = frame.nodes.find((one) => one.id === id);
  if (found === undefined) throw new Error(`no node ${id}`);
  return found;
}

describe("sceneFrame", () => {
  test("shows every species idle on the home sky", () => {
    const frame = sceneFrame(places, null);
    expect(frame.layout).toBe("atlas");
    expect(frame.nodes).toHaveLength(151);
    expect(frame.nodes.every((one) => one.emphasis === "idle")).toBe(true);
    expect(namedNodes(frame)).toEqual([]);
  });

  test("flies to the best match of a name", () => {
    const frame = sceneFrame(places, bulbaSearch);
    const best = node(frame, "pokemon:bulbasaur");
    expect(frame.layout).toBe("focus");
    expect(best.emphasis).toBe("front");
    expect(best.position).toEqual(places.get("bulbasaur"));
    expect(frame.camera.target).toEqual(best.position);
    expect(node(frame, "pokemon:pikachu").emphasis).toBe("dim");
  });

  test("aligns criteria results on the axis of their stat, the first at the far end", () => {
    const frame = sceneFrame(places, fastElectricSearch);
    const first = node(frame, "pokemon:electrode");
    const lit = namedNodes(frame);
    expect(frame.layout).toBe("axis");
    expect(frame.axis?.label).toBe("Speed");
    expect(first.rank).toBe(1);
    expect(Math.max(...lit.map((one) => one.position.x))).toBe(first.position.x);
    expect(node(frame, "pokemon:bulbasaur").position.z).toBeLessThan(-10);
  });

  test("gathers the carriers of an effect around its move, linked with the chance", () => {
    const frame = sceneFrame(places, sleepSearch);
    const spore = node(frame, "move:spore");
    const paras = node(frame, "pokemon:paras");
    const link = frame.links.find((one) => one.target === "pokemon:paras");
    expect(frame.layout).toBe("hubs");
    expect(link).toEqual({ source: "move:spore", target: "pokemon:paras", strength: 1 });
    expect(
      Math.hypot(paras.position.x - spore.position.x, paras.position.y - spore.position.y),
    ).toBeLessThan(3);
    expect(frame.links.find((one) => one.target === "pokemon:vileplume")?.strength).toBe(0.75);
  });

  test("rings a weather team by role and links the weather to its mechanisms", () => {
    const frame = sceneFrame(places, rainTeamSearch);
    expect(frame.layout).toBe("rings");
    expect(frame.weather).toBe("rain");
    expect(node(frame, "weather:rain").emphasis).toBe("front");
    expect(node(frame, "pokemon:poliwag").ring).toBe("Benefit");
    expect(node(frame, "pokemon:lapras").ring).toBe("Benefit");
    const labels = frame.links.map((one) => linkLabel(frame, one));
    expect(labels).toContain("Rain → Swift Swim");
    expect(frame.rings.map((ring) => ring.name)).toContain("Benefit");
  });

  test("lights up exploration results where they are", () => {
    const frame = sceneFrame(places, psychicSearch);
    const lit = namedNodes(frame).filter((one) => one.kind === "pokemon");
    expect(frame.layout).toBe("atlas");
    expect(lit.length).toBeGreaterThan(0);
    for (const one of lit) expect(one.position).toEqual(places.get(one.ref?.name ?? ""));
  });

  test("names a node with its neighbours", () => {
    const frame = sceneFrame(places, rainTeamSearch);
    const around = neighbours(frame, "ability:swift-swim");
    expect(around.has("ability:swift-swim")).toBe(true);
    expect(around.has("weather:rain")).toBe(true);
    expect(around.has("pokemon:poliwag")).toBe(true);
  });
});
