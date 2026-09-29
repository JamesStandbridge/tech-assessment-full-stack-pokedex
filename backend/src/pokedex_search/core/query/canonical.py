"""Write a plan back as a query in canonical vocabulary, which parses to the same plan."""

from typing import assert_never

from pokedex_search.core.query.refinements import derive_refinements
from pokedex_search.core.query.vocabulary import Vocabulary
from pokedex_search.domain.facts import EffectMode
from pokedex_search.domain.plan import (
    Characteristic,
    CharacteristicFacet,
    RelationPredicate,
    SearchPlan,
    SortDirection,
    WeatherConstraint,
)
from pokedex_search.domain.results import Refinement

_LEARNED_BY = "learned by"


class CanonicalWriter:
    """Writes plans with the first phrase of every vocabulary list."""

    def __init__(self, vocabulary: Vocabulary) -> None:
        """Keep the vocabulary.

        Args:
            vocabulary: Every word the search understands.
        """
        self._vocabulary = vocabulary

    def serialize(self, plan: SearchPlan) -> str:
        """Return the canonical query of a plan."""
        return " ".join(part for part in self._parts(plan) if part)

    def refinements(self, plan: SearchPlan) -> tuple[Refinement, ...]:
        """Return ready-to-run adjustments of a plan, written canonically."""
        return derive_refinements(plan, self.serialize)

    def _parts(self, plan: SearchPlan) -> list[str]:
        words = self._vocabulary
        parts = [f"#{plan.dex_number}" if plan.dex_number is not None else "", plan.name or ""]
        parts += [
            f"{words.directions[sort.direction][0]} {words.stats[sort.stat][0]}"
            for sort in plan.stat_sort
        ]
        parts += [
            f"{words.stats[rule.stat][0]} {words.comparators[rule.comparator][0]} {rule.value}"
            for rule in plan.stat_filters
        ]
        parts += list(plan.types)
        parts += [self._characteristic(item) for item in plan.characteristics]
        parts += [words.damage_classes[item][0] for item in plan.damage_classes]
        parts += [self._effect(plan), self._weather(plan.weather), self._relation(plan)]
        kinds = [words.kinds[kind][0] for kind in plan.kinds]
        if plan.effect is not None and plan.effect.effect in words.types:
            return kinds + parts
        return parts + kinds

    def _characteristic(self, item: Characteristic) -> str:
        words = self._vocabulary
        lookup = {
            CharacteristicFacet.COLOR: lambda: words.colors[item.value][0],
            CharacteristicFacet.HABITAT: lambda: words.habitats[item.value][0],
            CharacteristicFacet.LEGENDARY: lambda: words.legendary[0],
            CharacteristicFacet.MYTHICAL: lambda: words.mythical[0],
        }
        write = lookup.get(item.facet)
        return write() if write else item.value

    def _effect(self, plan: SearchPlan) -> str:
        effect = plan.effect
        if effect is None:
            return ""
        words = self._vocabulary
        name = words.effect_phrases[effect.effect][0]
        if effect.mode is EffectMode.PREVENTS:
            return f"{words.modes[EffectMode.PREVENTS][0]} {name}"
        default = words.default_targets[effect.effect]
        if effect.target is not None and (effect.target is not default or name in words.types):
            return f"{name} {words.targets[effect.target][0]}"
        return name

    def _weather(self, weather: WeatherConstraint | None) -> str:
        if weather is None:
            return ""
        name = self._vocabulary.weathers[weather.weather][0]
        if weather.stat is None:
            return name
        comparative = next(
            adjective.comparatives[0]
            for adjective in self._vocabulary.stat_adjectives
            if adjective.stat is weather.stat
            and adjective.direction is SortDirection.DESC
            and adjective.comparatives
        )
        return f"{comparative} {name}"

    def _relation(self, plan: SearchPlan) -> str:
        relation = plan.relation
        if relation is None:
            return ""
        entity = relation.entity.name.replace("-", " ")
        relations = self._vocabulary.relations
        match relation.predicate:
            case RelationPredicate.LEARNS_MOVE:
                return f"{relations['learns'][0]} {entity}"
            case RelationPredicate.HAS_ABILITY:
                return f"{relations['has'][0]} {entity}"
            case RelationPredicate.LEARNED_BY:
                return f"{_LEARNED_BY} {entity}"
            case RelationPredicate.CARRIED_BY:
                return entity
            case _:
                assert_never(relation.predicate)
