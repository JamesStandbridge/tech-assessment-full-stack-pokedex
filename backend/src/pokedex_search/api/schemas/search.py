"""Wire shape of the search response."""

from typing import Annotated, Literal

from pydantic import Field

from pokedex_search.api.schemas.common import EntityRefDTO, StatsDTO, Wire
from pokedex_search.domain.entities import DamageClass, EntityKind
from pokedex_search.domain.facts import EffectMode, EffectTarget, WeatherRole
from pokedex_search.domain.plan import SearchPlan
from pokedex_search.domain.results import (
    NoticeCode,
    ReasonType,
    RefinementAction,
    SearchOutcome,
    SuggestionKind,
)
from pokedex_search.domain.terms import TermRole


class ReasonDTO(Wire):
    """Why a result matched."""

    type: ReasonType
    detail: str
    related: EntityRefDTO | None
    probability: float | None
    mode: EffectMode | None
    target: EffectTarget | None
    weather_role: WeatherRole | None


class ResultBaseDTO(Wire):
    """Fields every result has."""

    name: str
    rank: int
    reasons: list[ReasonDTO]


class PokemonResultDTO(ResultBaseDTO):
    """A Pokémon result."""

    kind: Literal[EntityKind.POKEMON] = EntityKind.POKEMON
    id: int
    types: list[str]
    stats: StatsDTO
    abilities: list[str]
    genus: str | None
    description: str | None
    sprite_url: str | None
    artwork_url: str | None


class MoveResultDTO(ResultBaseDTO):
    """A move result."""

    kind: Literal[EntityKind.MOVE] = EntityKind.MOVE
    id: int
    type: str
    damage_class: DamageClass
    power: int | None
    accuracy: int | None
    pp: int | None
    priority: int
    effect_chance: int | None
    short_effect: str | None


class AbilityResultDTO(ResultBaseDTO):
    """An ability result."""

    kind: Literal[EntityKind.ABILITY] = EntityKind.ABILITY
    id: int
    short_effect: str | None
    generation: str


ResultDTO = Annotated[
    PokemonResultDTO | MoveResultDTO | AbilityResultDTO, Field(discriminator="kind")
]


class SectionDTO(Wire):
    """One page of the results of one kind."""

    kind: EntityKind
    total: int
    results: list[ResultDTO]
    next_cursor: str | None


class TermDTO(Wire):
    """A query term and its role."""

    text: str
    role: TermRole
    value: str | None


class NoticeDTO(Wire):
    """An honest caveat."""

    code: NoticeCode
    message: str


class SuggestionDTO(Wire):
    """A query to try instead."""

    kind: SuggestionKind
    label: str
    query: str


class RefinementDTO(Wire):
    """An adjustment of one constraint."""

    constraint: str
    action: RefinementAction
    label: str
    query: str


class InterpretationDTO(Wire):
    """How the query was read."""

    alternatives: list[SearchPlan]
    summary: str


class SearchResponseDTO(Wire):
    """Body of a search response."""

    query: str
    canonical_query: str | None
    outcome: SearchOutcome
    interpretation: InterpretationDTO
    terms: list[TermDTO]
    notices: list[NoticeDTO]
    explanation: str | None
    suggestions: list[SuggestionDTO]
    best_match: EntityRefDTO | None
    refinements: list[RefinementDTO]
    sections: list[SectionDTO]
