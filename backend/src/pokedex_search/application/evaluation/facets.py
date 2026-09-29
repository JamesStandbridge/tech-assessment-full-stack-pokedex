"""Evaluate constraints that are plain facet filters: types, characteristics, damage classes."""

from functools import reduce

from pokedex_search.application.evaluation.base import Evaluation, uniform
from pokedex_search.application.facets import Facet, FacetName
from pokedex_search.application.ports import FacetIndex
from pokedex_search.core.ranking.reasons import characteristic_reason, type_reason
from pokedex_search.domain.entities import EntityKind, EntityRef
from pokedex_search.domain.plan import CharacteristicFacet, SearchPlan
from pokedex_search.domain.results import Reason, ReasonType

_CHARACTERISTIC_FACETS = {
    CharacteristicFacet.GENUS: FacetName.GENUS,
    CharacteristicFacet.COLOR: FacetName.COLOR,
    CharacteristicFacet.HABITAT: FacetName.HABITAT,
    CharacteristicFacet.LEGENDARY: FacetName.LEGENDARY,
    CharacteristicFacet.MYTHICAL: FacetName.MYTHICAL,
}


def _intersection(
    sets: list[frozenset[EntityRef]], universe: frozenset[EntityRef]
) -> frozenset[EntityRef]:
    return reduce(frozenset.intersection, sets, universe)


class TypeEvaluator:
    """Keeps entities that have every named type."""

    def __init__(self, facets: FacetIndex) -> None:
        """Keep the facet index.

        Args:
            facets: Inverted index of entities.
        """
        self._facets = facets

    def applies(self, plan: SearchPlan) -> bool:
        """Tell whether the plan names types."""
        return bool(plan.types)

    def kinds(self, plan: SearchPlan) -> frozenset[EntityKind]:
        """Pokémon have up to two types; a move has one, so only one type can match moves."""
        if len(plan.types) == 1:
            return frozenset({EntityKind.POKEMON, EntityKind.MOVE})
        return frozenset({EntityKind.POKEMON})

    def evaluate(self, plan: SearchPlan, universe: frozenset[EntityRef]) -> Evaluation:
        """Return the entities that have all the types."""
        sets = [self._facets.having(Facet(name=FacetName.TYPE, value=name)) for name in plan.types]
        return uniform(_intersection(sets, universe), type_reason(plan.types))


class CharacteristicEvaluator:
    """Keeps Pokémon with every named characteristic."""

    def __init__(self, facets: FacetIndex) -> None:
        """Keep the facet index.

        Args:
            facets: Inverted index of entities.
        """
        self._facets = facets

    def applies(self, plan: SearchPlan) -> bool:
        """Tell whether the plan names characteristics other than description words."""
        return any(item.facet in _CHARACTERISTIC_FACETS for item in plan.characteristics)

    def kinds(self, plan: SearchPlan) -> frozenset[EntityKind]:
        """Characteristics belong to species."""
        return frozenset({EntityKind.POKEMON})

    def evaluate(self, plan: SearchPlan, universe: frozenset[EntityRef]) -> Evaluation:
        """Return the Pokémon that have all the characteristics."""
        named = [item for item in plan.characteristics if item.facet in _CHARACTERISTIC_FACETS]
        sets = [
            self._facets.having(Facet(name=_CHARACTERISTIC_FACETS[item.facet], value=item.value))
            for item in named
        ]
        refs = _intersection(sets, universe)
        reasons = tuple(characteristic_reason(item) for item in named)
        return Evaluation(refs=refs, reasons=dict.fromkeys(refs, reasons))


class DamageClassEvaluator:
    """Keeps moves of any named damage class."""

    def __init__(self, facets: FacetIndex) -> None:
        """Keep the facet index.

        Args:
            facets: Inverted index of entities.
        """
        self._facets = facets

    def applies(self, plan: SearchPlan) -> bool:
        """Tell whether the plan names damage classes."""
        return bool(plan.damage_classes)

    def kinds(self, plan: SearchPlan) -> frozenset[EntityKind]:
        """Damage classes belong to moves."""
        return frozenset({EntityKind.MOVE})

    def evaluate(self, plan: SearchPlan, universe: frozenset[EntityRef]) -> Evaluation:
        """Return the moves of the named damage classes."""
        refs: frozenset[EntityRef] = frozenset().union(
            *(
                self._facets.having(Facet(name=FacetName.DAMAGE_CLASS, value=value))
                for value in plan.damage_classes
            )
        )
        detail = f"{' or '.join(plan.damage_classes)} move"
        return uniform(refs & universe, Reason(type=ReasonType.CHARACTERISTIC, detail=detail))
