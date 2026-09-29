"""Evaluate stat comparisons and stat rankings."""

from pokedex_search.application.evaluation.base import Evaluation
from pokedex_search.application.ports import EntityCatalog, StatDistribution
from pokedex_search.core.ranking.reasons import stat_filter_reason, stat_rank_reason
from pokedex_search.core.ranking.stats import satisfies, sort_key
from pokedex_search.domain.entities import EntityKind, EntityRef
from pokedex_search.domain.plan import SearchPlan
from pokedex_search.domain.results import Reason
from pokedex_search.domain.stats import StatName, stat_kind, stat_value


class StatEvaluator:
    """Filters by stat comparisons, and ranks by requested stats."""

    def __init__(self, catalog: EntityCatalog, distribution: StatDistribution) -> None:
        """Keep the catalog and the stat distributions.

        Args:
            catalog: Read access to entities.
            distribution: Distribution of every stat, for percentile ranks.
        """
        self._catalog = catalog
        self._distribution = distribution

    def applies(self, plan: SearchPlan) -> bool:
        """Tell whether the plan compares or ranks by stats."""
        return bool(plan.stat_sort or plan.stat_filters)

    def kinds(self, plan: SearchPlan) -> frozenset[EntityKind]:
        """Return the kind every requested stat belongs to, or nothing if they differ."""
        stats = [item.stat for item in plan.stat_sort] + [item.stat for item in plan.stat_filters]
        kinds = {stat_kind(stat) for stat in stats}
        return frozenset(kinds) if len(kinds) == 1 else frozenset()

    def evaluate(self, plan: SearchPlan, universe: frozenset[EntityRef]) -> Evaluation:
        """Return the entities that have every requested stat and satisfy every comparison."""
        stats = {item.stat for item in plan.stat_sort} | {item.stat for item in plan.stat_filters}
        percentiles = {
            item.stat: self._distribution.percentiles(item.stat) for item in plan.stat_sort
        }
        refs: set[EntityRef] = set()
        keys: dict[EntityRef, tuple[float, ...]] = {}
        reasons: dict[EntityRef, tuple[Reason, ...]] = {}
        for ref in universe:
            values = self._values(ref, stats)
            if values is None:
                continue
            if not all(satisfies(values[rule.stat], rule) for rule in plan.stat_filters):
                continue
            refs.add(ref)
            if plan.stat_sort:
                keys[ref] = sort_key(values, plan.stat_sort, percentiles)
            reasons[ref] = tuple(
                stat_filter_reason(rule, values[rule.stat]) for rule in plan.stat_filters
            ) + tuple(stat_rank_reason(sort, values[sort.stat]) for sort in plan.stat_sort)
        return Evaluation(refs=frozenset(refs), keys=keys, reasons=reasons)

    def _values(self, ref: EntityRef, stats: set[StatName]) -> dict[StatName, int] | None:
        entity = self._catalog.get(ref)
        if entity is None:
            return None
        values: dict[StatName, int] = {}
        for stat in stats:
            value = stat_value(entity, stat)
            if value is None:
                return None
            values[stat] = value
        return values
