import type { EntityKind } from "../../api/contract";
import { assertNever } from "../../domain/assertNever";
import type { SceneNode } from "../../domain/sceneTypes";
import type { Theme } from "../../domain/theme";
import { THEME_INKS } from "../theme/boot";

/** The type colors of ui/tokens.css, as literals: the worker cannot read CSS variables. */
const TYPE_COLORS: Readonly<Record<string, string>> = {
  normal: "#a8a77a",
  fire: "#ee8130",
  water: "#6390f0",
  electric: "#f7d02c",
  grass: "#7ac74c",
  ice: "#96d9d6",
  fighting: "#c22e28",
  poison: "#a33ea1",
  ground: "#e2bf65",
  flying: "#a98ff3",
  psychic: "#f95587",
  bug: "#a6b91a",
  rock: "#b6a136",
  ghost: "#735797",
  dragon: "#6f35fc",
  dark: "#705746",
  steel: "#b7b7ce",
  fairy: "#d685ad",
};

const KIND_COLORS: Readonly<Record<EntityKind | "weather", string>> = {
  pokemon: "#e8ecf6",
  move: "#f07cff",
  ability: "#7cc4ff",
  weather: "#5fd4ff",
};

const WEATHER_COLORS: Readonly<Record<string, string>> = {
  rain: "#6fb4ff",
  sun: "#ffb35c",
  sandstorm: "#e2bf65",
  hail: "#dff3ff",
};

/** How much darker a colour is printed on the light sky than it glows on the night one. */
export const PRINT_SHADE = 0.55;

export function skyHex(theme: Theme): string {
  return THEME_INKS[theme];
}

export function printedHex(hex: string, theme: Theme): string {
  if (theme === "dark") return hex;
  const value = Number.parseInt(hex.slice(1), 16);
  return `#${[16, 8, 0]
    .map((shift) => Math.round(((value >> shift) & 255) * PRINT_SHADE))
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function typeHex(type: string): string {
  return TYPE_COLORS[type] ?? KIND_COLORS.pokemon;
}

export function kindHex(kind: EntityKind | "weather"): string {
  return KIND_COLORS[kind];
}

export function weatherHex(weather: string): string {
  return WEATHER_COLORS[weather] ?? KIND_COLORS.weather;
}

/** The colour of a move, ability or weather: its type for a move, its own for a weather. */
export function emblemHex(node: SceneNode): string {
  const emblem = node.emblem;
  if (emblem === null) return kindHex(node.kind);
  switch (emblem.kind) {
    case "move":
      return typeHex(emblem.type);
    case "ability":
      return kindHex("ability");
    case "weather":
      return weatherHex(emblem.weather);
    default:
      return assertNever(emblem);
  }
}
