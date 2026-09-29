import type { EntityRef, PokemonResult, WeatherRole } from "../api/contract";
import { refKey, refOf } from "./entities";

export const TEAM_SIZE = 6;

export interface TeamMember {
  readonly ref: EntityRef;
  readonly spriteUrl: string | null;
  /** Weathers the Pokémon was found to set, benefit from or be protected in. */
  readonly weathers: readonly string[];
}

const HELPFUL_ROLES: ReadonlySet<WeatherRole> = new Set(["setter", "benefit", "protection"]);

/** A Pokémon joining the team, with the weather of the search it was found in, if it helps. */
export function memberOf(pokemon: PokemonResult, weather: string | null): TeamMember {
  const helped = pokemon.reasons.some(
    (reason) => reason.weather_role !== null && HELPFUL_ROLES.has(reason.weather_role),
  );
  return {
    ref: refOf(pokemon),
    spriteUrl: pokemon.sprite_url,
    weathers: weather !== null && helped ? [weather] : [],
  };
}

export function inTeam(team: readonly TeamMember[], ref: EntityRef): boolean {
  return team.some((member) => refKey(member.ref) === refKey(ref));
}

/** Add a member unless the team is full or already holds it. */
export function withMember(team: readonly TeamMember[], member: TeamMember): readonly TeamMember[] {
  if (team.length >= TEAM_SIZE || inTeam(team, member.ref)) return team;
  return [...team, member];
}

export function withoutMember(team: readonly TeamMember[], ref: EntityRef): readonly TeamMember[] {
  return team.filter((member) => refKey(member.ref) !== refKey(ref));
}

/** The weathers every member of the team helps with (SYS-UI-013). */
export function sharedWeathers(team: readonly TeamMember[]): readonly string[] {
  const [first, ...others] = team;
  if (first === undefined) return [];
  return first.weathers.filter((weather) =>
    others.every((member) => member.weathers.includes(weather)),
  );
}
