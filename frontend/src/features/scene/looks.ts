import { assertNever } from "../../domain/assertNever";
import type { Emphasis, SceneNode } from "../../domain/sceneTypes";

/** How big a star is, how much of its sprite shows, and how much it glows. */
export interface Look {
  readonly size: number;
  readonly sprite: number;
  readonly glow: number;
}

export const HIDDEN: Look = { size: 0, sprite: 0, glow: 0 };

const HIGHLIGHT_GROWTH = 1.35;
const HIGHLIGHT_GLOW = 0.7;

function speciesLook(emphasis: Emphasis): Look {
  switch (emphasis) {
    case "idle":
      return { size: 1.6, sprite: 0.95, glow: 0.45 };
    case "lit":
      return { size: 2, sprite: 1, glow: 0.7 };
    case "front":
      return { size: 3.4, sprite: 1, glow: 1 };
    case "dim":
      return { size: 0.3, sprite: 0, glow: 0.45 };
    default:
      return assertNever(emphasis);
  }
}

function hubLook(emphasis: Emphasis): Look {
  switch (emphasis) {
    case "idle":
    case "lit":
      return { size: 1.3, sprite: 0, glow: 1.3 };
    case "front":
      return { size: 2.6, sprite: 0, glow: 1.7 };
    case "dim":
      return { size: 0.4, sprite: 0, glow: 0.5 };
    default:
      return assertNever(emphasis);
  }
}

export function lookOf(node: SceneNode, highlighted: boolean): Look {
  const look = node.kind === "pokemon" ? speciesLook(node.emphasis) : hubLook(node.emphasis);
  if (!highlighted) {
    return look;
  }
  return { ...look, size: look.size * HIGHLIGHT_GROWTH, glow: look.glow + HIGHLIGHT_GLOW };
}
