import type { EntityKind, EntityRef, Result } from "../api/contract";
import { assertNever } from "./assertNever";

/** A stable identifier of an entity, used as list key and in the page. */
export function refKey(ref: EntityRef): string {
  return `${ref.kind}:${ref.name}`;
}

export function refOf(result: Result): EntityRef {
  return { kind: result.kind, name: result.name };
}

/** Turn a kebab-case dataset name into a title, such as mr-mime into Mr Mime. */
export function displayName(name: string): string {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Return the one-line description of a result under its name. */
export function resultSummary(result: Result): string {
  switch (result.kind) {
    case "pokemon":
      return result.genus ?? result.types.join(" / ");
    case "move":
      return `${result.damage_class} move`;
    case "ability":
      return result.short_effect ?? `Generation ${result.generation}`;
    default:
      return assertNever(result);
  }
}

export function kindLabel(kind: EntityKind, count: number): string {
  const plural = count !== 1;
  switch (kind) {
    case "pokemon":
      return "Pokémon";
    case "move":
      return plural ? "Moves" : "Move";
    case "ability":
      return plural ? "Abilities" : "Ability";
    default:
      return assertNever(kind);
  }
}
