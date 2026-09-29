"""Typed model of the vocabulary resource. The first phrase of each list is canonical."""

from pokedex_search.domain.entities import DamageClass, EntityKind, Frozen
from pokedex_search.domain.facts import EffectMode, EffectTarget
from pokedex_search.domain.plan import Comparator, SortDirection
from pokedex_search.domain.stats import StatName


class StatAdjective(Frozen):
    """Adjectives that imply a stat and a direction, such as fast or bulky."""

    phrases: tuple[str, ...]
    comparatives: tuple[str, ...]
    stat: StatName
    direction: SortDirection
    move_stat: StatName | None = None


class Vocabulary(Frozen):
    """Every word the search understands, grouped by role."""

    kinds: dict[EntityKind, tuple[str, ...]]
    types: tuple[str, ...]
    stats: dict[StatName, tuple[str, ...]]
    stat_adjectives: tuple[StatAdjective, ...]
    directions: dict[SortDirection, tuple[str, ...]]
    comparators: dict[Comparator, tuple[str, ...]]
    colors: dict[str, tuple[str, ...]]
    habitats: dict[str, tuple[str, ...]]
    legendary: tuple[str, ...]
    mythical: tuple[str, ...]
    damage_classes: dict[DamageClass, tuple[str, ...]]
    effects: dict[str, tuple[str, ...]]
    modes: dict[EffectMode, tuple[str, ...]]
    targets: dict[EffectTarget, tuple[str, ...]]
    weathers: dict[str, tuple[str, ...]]
    relations: dict[str, tuple[str, ...]]
    fillers: tuple[str, ...]
    examples: tuple[str, ...]
