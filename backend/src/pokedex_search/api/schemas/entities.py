"""Wire shapes of entity details and typing suggestions."""

from typing import Annotated, Literal

from pydantic import Field

from pokedex_search.api.schemas.common import EntityRefDTO, StatsDTO, Wire
from pokedex_search.domain.entities import DamageClass, EntityKind
from pokedex_search.domain.suggestions import TypingSuggestionKind


class PokemonDetailDTO(Wire):
    """A Pokémon with its relations."""

    kind: Literal[EntityKind.POKEMON] = EntityKind.POKEMON
    id: int
    name: str
    types: list[str]
    stats: StatsDTO
    abilities: list[str]
    moves: list[str]
    genus: str | None
    description: str | None
    height_decimetres: int
    weight_hectograms: int
    color: str
    shape: str | None
    habitat: str | None
    is_legendary: bool
    is_mythical: bool
    evolution_family: list[str]
    sprite_url: str | None
    artwork_url: str | None


class MoveDetailDTO(Wire):
    """A move with the Pokémon that learn it."""

    kind: Literal[EntityKind.MOVE] = EntityKind.MOVE
    id: int
    name: str
    type: str
    damage_class: DamageClass
    power: int | None
    accuracy: int | None
    pp: int | None
    priority: int
    effect_chance: int | None
    short_effect: str | None
    effect: str | None
    learned_by: list[str]


class AbilityDetailDTO(Wire):
    """An ability with the Pokémon that carry it."""

    kind: Literal[EntityKind.ABILITY] = EntityKind.ABILITY
    id: int
    name: str
    short_effect: str | None
    effect: str | None
    generation: str
    pokemon: list[str]


class SpeciesDTO(Wire):
    """A Pokémon with what the constellation places it by."""

    id: int
    name: str
    types: list[str]
    stats: StatsDTO
    genus: str | None
    is_legendary: bool
    is_mythical: bool
    sprite_url: str | None


class SpeciesResponseDTO(Wire):
    """Every Pokémon, in Pokédex order."""

    species: list[SpeciesDTO]


EntityDetailDTO = Annotated[
    PokemonDetailDTO | MoveDetailDTO | AbilityDetailDTO, Field(discriminator="kind")
]


class ConceptDTO(Wire):
    """A vocabulary concept."""

    role: str
    value: str


class SuggestItemDTO(Wire):
    """A completion of a partial query."""

    kind: TypingSuggestionKind
    label: str
    query: str
    entity: EntityRefDTO | None
    concept: ConceptDTO | None


class SuggestResponseDTO(Wire):
    """Body of a suggestion response."""

    suggestions: list[SuggestItemDTO]
