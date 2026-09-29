"""Evaluate effect constraints by probability of success."""

from pokedex_search.application.evaluation.base import ALL_KINDS, Evaluation
from pokedex_search.application.facets import effect_facet
from pokedex_search.application.ports import FacetIndex, ProfileStore
from pokedex_search.core.ranking.effects import best_effect, effect_key
from pokedex_search.core.ranking.reasons import effect_reason
from pokedex_search.domain.entities import EntityKind, EntityRef
from pokedex_search.domain.plan import SearchPlan
from pokedex_search.domain.results import Reason


class EffectEvaluator:
    """Keeps entities that cause or prevent an effect, ranked by their best source."""

    def __init__(self, facets: FacetIndex, profiles: ProfileStore) -> None:
        """Keep the facet index and the profiles.

        Args:
            facets: Inverted index of entities.
            profiles: Denormalized facts of every entity.
        """
        self._facets = facets
        self._profiles = profiles

    def applies(self, plan: SearchPlan) -> bool:
        """Tell whether the plan holds an effect."""
        return plan.effect is not None

    def kinds(self, plan: SearchPlan) -> frozenset[EntityKind]:
        """Moves, abilities and the Pokémon that carry them can relate to effects."""
        return ALL_KINDS

    def evaluate(self, plan: SearchPlan, universe: frozenset[EntityRef]) -> Evaluation:
        """Return the entities with the effect, keyed by the probability of their best source."""
        constraint = plan.effect
        if constraint is None:
            return Evaluation(refs=frozenset())
        facet = effect_facet(constraint.effect, constraint.mode, constraint.target)
        refs = self._facets.having(facet) & universe
        keys: dict[EntityRef, tuple[float, ...]] = {}
        reasons: dict[EntityRef, tuple[Reason, ...]] = {}
        for ref in refs:
            best = best_effect(self._profiles.profile(ref), constraint)
            if best is not None:
                keys[ref] = effect_key(best)
                reasons[ref] = (effect_reason(best, ref),)
        return Evaluation(refs=frozenset(keys), keys=keys, reasons=reasons)
