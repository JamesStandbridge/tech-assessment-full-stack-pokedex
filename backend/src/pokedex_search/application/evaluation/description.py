"""Evaluate description words: an approximate match on species descriptions."""

from pokedex_search.application.evaluation.base import Evaluation
from pokedex_search.application.ports import DescriptionIndex
from pokedex_search.core.ranking.reasons import description_reason
from pokedex_search.domain.entities import EntityKind, EntityRef
from pokedex_search.domain.plan import CharacteristicFacet, SearchPlan

_SCORED_FACETS = frozenset({CharacteristicFacet.DESCRIPTION, CharacteristicFacet.GENUS})


class DescriptionEvaluator:
    """Keeps Pokémon whose description mentions a description word, ranked by BM25."""

    def __init__(self, descriptions: DescriptionIndex) -> None:
        """Keep the description index.

        Args:
            descriptions: BM25 search over species descriptions.
        """
        self._descriptions = descriptions

    def applies(self, plan: SearchPlan) -> bool:
        """Tell whether the plan holds description words."""
        return any(item.facet is CharacteristicFacet.DESCRIPTION for item in plan.characteristics)

    def kinds(self, plan: SearchPlan) -> frozenset[EntityKind]:
        """Descriptions belong to species."""
        return frozenset({EntityKind.POKEMON})

    def evaluate(self, plan: SearchPlan, universe: frozenset[EntityRef]) -> Evaluation:
        """Filter on the description words, and score with every descriptive word."""
        words = tuple(
            item.value
            for item in plan.characteristics
            if item.facet is CharacteristicFacet.DESCRIPTION
        )
        scored = tuple(item.value for item in plan.characteristics if item.facet in _SCORED_FACETS)
        mentioning = self._descriptions.search(words)
        scores = self._descriptions.search(scored)
        refs = frozenset(ref for ref in mentioning if ref in universe)
        reason = description_reason(words)
        return Evaluation(
            refs=refs,
            keys={ref: (-scores.get(ref, 0.0),) for ref in refs},
            reasons=dict.fromkeys(refs, (reason,)),
            approximate=True,
        )
