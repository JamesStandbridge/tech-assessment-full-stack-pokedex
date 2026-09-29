"""Typed model of the vocabulary resource. The first phrase of each list is canonical."""

from functools import cached_property

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


class StatChangeVerbs(Frozen):
    """Verbs of one direction of stat change, and whom it applies to without a named target."""

    target: EffectTarget
    verbs: tuple[str, ...]


class StatChanges(Frozen):
    """Verbs and stats whose pairs name stat change effects, such as raise-attack."""

    directions: dict[str, StatChangeVerbs]
    stats: dict[str, tuple[str, ...]]

    def effects(self) -> dict[str, tuple[str, ...]]:
        """Return the phrases of every stat change effect, named direction-stat."""
        return {
            f"{direction}-{stat}": tuple(
                f"{verb} {phrase}" for verb in change.verbs for phrase in phrases
            )
            for direction, change in self.directions.items()
            for stat, phrases in self.stats.items()
        }

    def targets(self) -> dict[str, EffectTarget]:
        """Return whom every stat change effect applies to without a named target."""
        return {
            f"{direction}-{stat}": change.target
            for direction, change in self.directions.items()
            for stat in self.stats
        }


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
    self_effects: tuple[str, ...]
    stat_changes: StatChanges
    modes: dict[EffectMode, tuple[str, ...]]
    targets: dict[EffectTarget, tuple[str, ...]]
    weathers: dict[str, tuple[str, ...]]
    relations: dict[str, tuple[str, ...]]
    fillers: tuple[str, ...]
    examples: tuple[str, ...]

    @cached_property
    def effect_phrases(self) -> dict[str, tuple[str, ...]]:
        """Return the phrases of every effect, stat changes included."""
        return {**self.effects, **self.stat_changes.effects()}

    @cached_property
    def default_targets(self) -> dict[str, EffectTarget]:
        """Return whom every effect applies to when a query names no target."""
        defaults = {
            effect: EffectTarget.USER if effect in self.self_effects else EffectTarget.OPPONENT
            for effect in self.effects
        }
        return {**defaults, **self.stat_changes.targets()}
