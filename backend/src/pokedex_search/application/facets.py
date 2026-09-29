"""Facets: the inverted-index keys the plan evaluation filters on."""

from enum import StrEnum

from pokedex_search.domain.entities import Frozen
from pokedex_search.domain.facts import EffectMode, EffectTarget


class FacetName(StrEnum):
    """Dimensions an entity can be indexed under."""

    TYPE = "type"
    GENUS = "genus"
    COLOR = "color"
    HABITAT = "habitat"
    LEGENDARY = "legendary"
    MYTHICAL = "mythical"
    DAMAGE_CLASS = "damage-class"
    EFFECT = "effect"
    WEATHER = "weather"
    WEATHER_SETTER = "weather-setter"
    LEARNS_MOVE = "learns-move"
    HAS_ABILITY = "has-ability"
    LEARNED_BY = "learned-by"
    CARRIED_BY = "carried-by"


class Facet(Frozen):
    """One indexed value of one dimension."""

    name: FacetName
    value: str


def effect_facet(effect: str, mode: EffectMode, target: EffectTarget | None) -> Facet:
    """Return the facet of entities that relate to an effect in a given way."""
    return Facet(name=FacetName.EFFECT, value=f"{effect}|{mode}|{target or '-'}")
