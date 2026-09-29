import type { components } from "./schema.gen";

type Schemas = components["schemas"];

export type EntityKind = Schemas["EntityKind"];
export type EntityRef = Schemas["EntityRef"];
export type SearchResponse = Schemas["SearchResponse"];
export type SearchPlan = Schemas["SearchPlan"];
export type Term = Schemas["Term"];
export type TermRole = Term["role"];
export type Notice = Schemas["Notice"];
export type Suggestion = Schemas["Suggestion"];
export type Refinement = Schemas["Refinement"];
export type Section = Schemas["Section"];
export type Result = Schemas["Result"];
export type PokemonResult = Schemas["PokemonResult"];
export type MoveResult = Schemas["MoveResult"];
export type AbilityResult = Schemas["AbilityResult"];
export type Reason = Schemas["Reason"];
export type WeatherRole = NonNullable<Reason["weather_role"]>;
export type Stats = Schemas["Stats"];
export type StatName = Schemas["StatName"];
export type SuggestResponse = Schemas["SuggestResponse"];
export type SuggestItem = Schemas["SuggestItem"];
export type EntityDetail = Schemas["EntityDetail"];
export type PokemonDetail = Schemas["PokemonDetail"];
export type MoveDetail = Schemas["MoveDetail"];
export type AbilityDetail = Schemas["AbilityDetail"];
export type ErrorResponse = Schemas["ErrorResponse"];
