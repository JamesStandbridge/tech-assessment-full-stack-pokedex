"""Evaluate relations to an entity named in the query."""

from pokedex_search.application.evaluation.base import Evaluation, uniform
from pokedex_search.application.facets import Facet, FacetName
from pokedex_search.application.ports import FacetIndex
from pokedex_search.core.ranking.reasons import relation_reason
from pokedex_search.domain.entities import EntityKind, EntityRef
from pokedex_search.domain.plan import RelationPredicate, SearchPlan

_RESULTS = {
    RelationPredicate.LEARNS_MOVE: (EntityKind.POKEMON, FacetName.LEARNS_MOVE),
    RelationPredicate.HAS_ABILITY: (EntityKind.POKEMON, FacetName.HAS_ABILITY),
    RelationPredicate.LEARNED_BY: (EntityKind.MOVE, FacetName.LEARNED_BY),
    RelationPredicate.CARRIED_BY: (EntityKind.ABILITY, FacetName.CARRIED_BY),
}


class RelationEvaluator:
    """Keeps the entities linked to the named entity by the relation."""

    def __init__(self, facets: FacetIndex) -> None:
        """Keep the facet index.

        Args:
            facets: Inverted index of entities.
        """
        self._facets = facets

    def applies(self, plan: SearchPlan) -> bool:
        """Tell whether the plan follows a relation."""
        return plan.relation is not None

    def kinds(self, plan: SearchPlan) -> frozenset[EntityKind]:
        """Return the kind of entity the relation leads to."""
        if plan.relation is None:
            return frozenset()
        return frozenset({_RESULTS[plan.relation.predicate][0]})

    def evaluate(self, plan: SearchPlan, universe: frozenset[EntityRef]) -> Evaluation:
        """Return the linked entities."""
        relation = plan.relation
        if relation is None:
            return Evaluation(refs=frozenset())
        facet = Facet(name=_RESULTS[relation.predicate][1], value=relation.entity.name)
        return uniform(self._facets.having(facet) & universe, relation_reason(relation))
