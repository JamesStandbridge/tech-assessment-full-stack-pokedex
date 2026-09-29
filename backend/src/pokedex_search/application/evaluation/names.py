"""Evaluate name terms and Pokédex numbers."""

from pokedex_search.application.evaluation.base import ALL_KINDS, Evaluation, uniform
from pokedex_search.application.ports import EntityCatalog, NameIndex
from pokedex_search.core.ranking.names import NameTier
from pokedex_search.core.ranking.reasons import dex_reason, name_reason
from pokedex_search.domain.entities import EntityKind, EntityRef, Pokemon
from pokedex_search.domain.plan import SearchPlan


class NameEvaluator:
    """Matches a name term by tiers, then by bounded typos."""

    def __init__(self, names: NameIndex) -> None:
        """Keep the name index.

        Args:
            names: Name matching over every entity.
        """
        self._names = names

    def applies(self, plan: SearchPlan) -> bool:
        """Tell whether the plan names something."""
        return plan.name is not None

    def kinds(self, plan: SearchPlan) -> frozenset[EntityKind]:
        """Names exist for every kind."""
        return ALL_KINDS

    def evaluate(self, plan: SearchPlan, universe: frozenset[EntityRef]) -> Evaluation:
        """Return the matching entities, keyed by tier, distance and length gap."""
        kinds = frozenset(ref.kind for ref in universe)
        matches = [m for m in self._names.match(plan.name or "", kinds) if m.ref in universe]
        return Evaluation(
            refs=frozenset(match.ref for match in matches),
            keys={match.ref: (match.tier, match.distance, match.length_gap) for match in matches},
            reasons={match.ref: (name_reason(match),) for match in matches},
            approximate=any(match.tier is NameTier.FUZZY for match in matches),
        )


class DexNumberEvaluator:
    """Matches a Pokédex number."""

    def __init__(self, catalog: EntityCatalog) -> None:
        """Keep the catalog.

        Args:
            catalog: Read access to entities.
        """
        self._catalog = catalog

    def applies(self, plan: SearchPlan) -> bool:
        """Tell whether the plan holds a Pokédex number."""
        return plan.dex_number is not None

    def kinds(self, plan: SearchPlan) -> frozenset[EntityKind]:
        """Pokédex numbers belong to Pokémon."""
        return frozenset({EntityKind.POKEMON})

    def evaluate(self, plan: SearchPlan, universe: frozenset[EntityRef]) -> Evaluation:
        """Return the Pokémon with the requested number."""
        number = plan.dex_number
        refs = frozenset(
            ref
            for ref in universe
            if isinstance(entity := self._catalog.get(ref), Pokemon) and entity.id == number
        )
        return uniform(refs, dex_reason(number or 0))
