"""Mutable accumulator of the constraints read so far, turned into a plan at the end."""

from dataclasses import dataclass, field

from pokedex_search.domain.entities import DamageClass, EntityKind, EntityRef
from pokedex_search.domain.facts import EffectMode, EffectTarget
from pokedex_search.domain.plan import (
    Characteristic,
    EffectConstraint,
    RelationConstraint,
    RelationPredicate,
    SearchPlan,
    StatFilter,
    StatSort,
    WeatherConstraint,
)
from pokedex_search.domain.stats import StatName


@dataclass(slots=True)
class PlanDraft:
    """Constraints collected while reading a query."""

    kinds: list[EntityKind] = field(default_factory=list)
    types: list[str] = field(default_factory=list)
    characteristics: list[Characteristic] = field(default_factory=list)
    sorts: list[StatSort] = field(default_factory=list)
    move_sorts: list[StatSort] = field(default_factory=list)
    filters: list[StatFilter] = field(default_factory=list)
    damage_classes: list[DamageClass] = field(default_factory=list)
    effect: str | None = None
    mode: EffectMode = EffectMode.CAUSES
    target: EffectTarget | None = None
    weather: str | None = None
    weather_stat: StatName | None = None
    mention: EntityRef | None = None

    def add_unique[ItemT](self, items: list[ItemT], item: ItemT) -> None:
        """Append an item unless it is already present."""
        if item not in items:
            items.append(item)

    def to_plan(self) -> SearchPlan:
        """Build the plan, resolving what depends on the whole query."""
        sorts = self.move_sorts if self.kinds == [EntityKind.MOVE] else self.sorts
        weather_stat = self.weather_stat if self.weather else None
        if weather_stat is not None:
            sorts = [sort for sort in sorts if sort.stat is not weather_stat]
        return SearchPlan(
            kinds=tuple(self.kinds),
            types=tuple(self.types),
            characteristics=tuple(self.characteristics),
            stat_sort=tuple(dict.fromkeys(sorts)),
            stat_filters=tuple(self.filters),
            damage_classes=tuple(self.damage_classes),
            effect=self._effect(),
            weather=WeatherConstraint(weather=self.weather, stat=weather_stat)
            if self.weather
            else None,
            relation=self._relation(),
        )

    def _effect(self) -> EffectConstraint | None:
        if self.effect is None:
            return None
        target = self.target
        if target is None and self.mode is EffectMode.CAUSES:
            target = EffectTarget.OPPONENT
        return EffectConstraint(effect=self.effect, mode=self.mode, target=target)

    def _relation(self) -> RelationConstraint | None:
        if self.mention is None:
            return None
        return RelationConstraint(predicate=self._predicate(self.mention), entity=self.mention)

    def _predicate(self, mention: EntityRef) -> RelationPredicate:
        if mention.kind is EntityKind.MOVE:
            return RelationPredicate.LEARNS_MOVE
        if mention.kind is EntityKind.ABILITY:
            return RelationPredicate.HAS_ABILITY
        if self.kinds == [EntityKind.ABILITY]:
            return RelationPredicate.CARRIED_BY
        return RelationPredicate.LEARNED_BY
