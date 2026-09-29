"""The conjunctive plan a query is read as."""

from enum import StrEnum

from pokedex_search.domain.entities import DamageClass, EntityKind, EntityRef, Frozen
from pokedex_search.domain.facts import EffectMode, EffectTarget
from pokedex_search.domain.stats import StatName


class SortDirection(StrEnum):
    """Direction of a stat ranking."""

    ASC = "asc"
    DESC = "desc"


class Comparator(StrEnum):
    """Comparison between a stat and a number."""

    GT = "gt"
    GTE = "gte"
    LT = "lt"
    LTE = "lte"


class CharacteristicFacet(StrEnum):
    """Species characteristics a query can name."""

    GENUS = "genus"
    COLOR = "color"
    HABITAT = "habitat"
    LEGENDARY = "legendary"
    MYTHICAL = "mythical"
    DESCRIPTION = "description"


class RelationPredicate(StrEnum):
    """Relations between entities a query can follow."""

    LEARNS_MOVE = "learns-move"
    HAS_ABILITY = "has-ability"
    LEARNED_BY = "learned-by"
    CARRIED_BY = "carried-by"


class StatSort(Frozen):
    """A stat to rank by."""

    stat: StatName
    direction: SortDirection


class StatFilter(Frozen):
    """A comparison every result satisfies."""

    stat: StatName
    comparator: Comparator
    value: int


class Characteristic(Frozen):
    """A species characteristic every Pokémon result has."""

    facet: CharacteristicFacet
    value: str


class EffectConstraint(Frozen):
    """An effect every result causes or prevents."""

    effect: str
    mode: EffectMode
    target: EffectTarget | None


class WeatherConstraint(Frozen):
    """A weather every result relates to, optionally through a stat it raises."""

    weather: str
    stat: StatName | None


class RelationConstraint(Frozen):
    """An entity every result is linked to."""

    predicate: RelationPredicate
    entity: EntityRef


class SearchPlan(Frozen):
    """Every constraint of one reading of a query; results satisfy all of them."""

    kinds: tuple[EntityKind, ...] = ()
    name: str | None = None
    dex_number: int | None = None
    types: tuple[str, ...] = ()
    characteristics: tuple[Characteristic, ...] = ()
    stat_sort: tuple[StatSort, ...] = ()
    stat_filters: tuple[StatFilter, ...] = ()
    damage_classes: tuple[DamageClass, ...] = ()
    effect: EffectConstraint | None = None
    weather: WeatherConstraint | None = None
    relation: RelationConstraint | None = None

    @property
    def is_empty(self) -> bool:
        """Tell whether the plan holds no constraint at all."""
        return self == SearchPlan(kinds=self.kinds)
