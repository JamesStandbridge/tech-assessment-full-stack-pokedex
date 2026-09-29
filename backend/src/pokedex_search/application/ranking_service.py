"""Rank every alternative plan of a query and merge them per kind."""

from collections.abc import Sequence

from pydantic import BaseModel, ConfigDict

from pokedex_search.application.evaluation.registry import PlanEvaluator, PlanRanking
from pokedex_search.application.pagination import fingerprint
from pokedex_search.application.ports import EntityCatalog
from pokedex_search.application.ranking_cache import RankingCache
from pokedex_search.domain.entities import EntityKind, EntityRef
from pokedex_search.domain.plan import SearchPlan
from pokedex_search.domain.results import RankedEntity


class MergedRanking(BaseModel):
    """Results of every alternative plan, merged per kind, with the ranking's identity."""

    model_config = ConfigDict(frozen=True)

    by_kind: dict[EntityKind, tuple[RankedEntity, ...]]
    approximate: bool
    fingerprint: str

    @property
    def is_empty(self) -> bool:
        """Tell whether no plan found anything."""
        return not any(self.by_kind.values())


def merge(rankings: Sequence[PlanRanking]) -> dict[EntityKind, tuple[RankedEntity, ...]]:
    """Merge rankings in plan order, keeping each entity once, at its first position."""
    merged: dict[EntityKind, list[RankedEntity]] = {}
    seen: set[EntityRef] = set()
    for ranking in rankings:
        for kind, items in ranking.by_kind.items():
            for item in items:
                if item.entity.ref not in seen:
                    seen.add(item.entity.ref)
                    merged.setdefault(kind, []).append(item)
    return {kind: tuple(items) for kind, items in merged.items()}


class RankingService:
    """Evaluates plans once per dataset version and serves later pages from a cache."""

    def __init__(
        self, evaluator: PlanEvaluator, catalog: EntityCatalog, cache: RankingCache
    ) -> None:
        """Keep the evaluator, the catalog and the cache.

        Args:
            evaluator: Evaluator of one plan.
            catalog: Read access to entities, source of the dataset version.
            cache: Cache of complete rankings.
        """
        self._evaluator = evaluator
        self._catalog = catalog
        self._cache = cache

    def rank(self, plans: Sequence[SearchPlan]) -> MergedRanking:
        """Return the merged ranking of the alternative plans of a query."""
        key = fingerprint(self._catalog.version(), plans)
        rankings = self._cache.get(key)
        if rankings is None:
            rankings = tuple(self._evaluator.evaluate(plan) for plan in plans)
            self._cache.put(key, rankings)
        return MergedRanking(
            by_kind=merge(rankings),
            approximate=any(ranking.approximate for ranking in rankings),
            fingerprint=key,
        )
