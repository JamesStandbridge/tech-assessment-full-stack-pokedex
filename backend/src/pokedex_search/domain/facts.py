"""Facts extracted from effect texts, and the search profile they build."""

from enum import StrEnum

from pokedex_search.domain.entities import EntityRef, Frozen
from pokedex_search.domain.stats import StatName


class EffectMode(StrEnum):
    """How an entity relates to an effect."""

    CAUSES = "causes"
    PREVENTS = "prevents"
    REQUIRES = "requires"


class EffectTarget(StrEnum):
    """Who an effect is applied to."""

    OPPONENT = "opponent"
    USER = "user"


class WeatherRole(StrEnum):
    """What a weather does for an entity, under that weather."""

    SETTER = "setter"
    BENEFIT = "benefit"
    PROTECTION = "protection"
    MIXED = "mixed"
    DRAWBACK = "drawback"


class EffectFact(Frozen):
    """An effect an entity causes, prevents or requires."""

    effect: str
    mode: EffectMode
    target: EffectTarget | None
    probability: float | None


class WeatherFact(Frozen):
    """What a weather does for an entity."""

    weather: str
    role: WeatherRole
    stat: StatName | None


class EntityFacts(Frozen):
    """Every fact extracted from the texts of one move or ability."""

    effects: tuple[EffectFact, ...]
    weathers: tuple[WeatherFact, ...]


class SourcedEffect(Frozen):
    """An effect fact and the entity it comes from."""

    fact: EffectFact
    source: EntityRef


class SourcedWeather(Frozen):
    """A weather fact and the entity it comes from."""

    fact: WeatherFact
    source: EntityRef


class SearchProfile(Frozen):
    """Every fact an entity reaches, directly or through its moves and abilities."""

    ref: EntityRef
    effects: tuple[SourcedEffect, ...]
    weathers: tuple[SourcedWeather, ...]
