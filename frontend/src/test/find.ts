import type {
  AbilityResult,
  EntityKind,
  PokemonResult,
  Result,
  SearchResponse,
  Section,
} from "../api/contract";

export function sectionOf(response: SearchResponse, kind: EntityKind): Section {
  const section = response.sections.find((candidate) => candidate.kind === kind);
  if (section === undefined) {
    throw new Error(`No ${kind} section in the response to ${response.query}.`);
  }
  return section;
}

export function resultNamed(response: SearchResponse, kind: EntityKind, name: string): Result {
  const result = sectionOf(response, kind).results.find((candidate) => candidate.name === name);
  if (result === undefined) {
    throw new Error(`No ${kind} ${name} in the response to ${response.query}.`);
  }
  return result;
}

export function pokemonNamed(response: SearchResponse, name: string): PokemonResult {
  const result = resultNamed(response, "pokemon", name);
  if (result.kind !== "pokemon") throw new Error(`${name} is not a Pokémon.`);
  return result;
}

export function abilityNamed(response: SearchResponse, name: string): AbilityResult {
  const result = resultNamed(response, "ability", name);
  if (result.kind !== "ability") throw new Error(`${name} is not an ability.`);
  return result;
}
