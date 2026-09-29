"""Rank by stats: raw values for one stat, mean percentile ranks for several."""

from bisect import bisect_left, bisect_right
from collections.abc import Iterable, Mapping, Sequence
from typing import assert_never

from pokedex_search.domain.plan import Comparator, SortDirection, StatFilter, StatSort
from pokedex_search.domain.stats import StatName


class Percentiles:
    """Percentile ranks of values within one stat's distribution."""

    def __init__(self, values: Iterable[int]) -> None:
        """Sort the distribution once.

        Args:
            values: Every value of the stat across the entities that have it.
        """
        self._values = sorted(values)

    def rank(self, value: int) -> float:
        """Return the mid-rank percentile of a value, between 0 and 1."""
        if not self._values:
            return 0.0
        below = bisect_left(self._values, value)
        up_to = bisect_right(self._values, value)
        return (below + up_to) / 2 / len(self._values)


def satisfies(value: int, rule: StatFilter) -> bool:
    """Tell whether a value satisfies a comparison."""
    match rule.comparator:
        case Comparator.GT:
            return value > rule.value
        case Comparator.GTE:
            return value >= rule.value
        case Comparator.LT:
            return value < rule.value
        case Comparator.LTE:
            return value <= rule.value
        case _:
            assert_never(rule.comparator)


def sort_key(
    values: Mapping[StatName, int],
    sorts: Sequence[StatSort],
    percentiles: Mapping[StatName, Percentiles],
) -> tuple[float, ...]:
    """Return the ascending sort key of an entity for the requested stats.

    Args:
        values: The entity's value for every requested stat.
        sorts: Requested stats and directions.
        percentiles: Distribution of every requested stat.

    Returns:
        A one-element key; lower sorts first.
    """
    if len(sorts) == 1:
        sort = sorts[0]
        value = float(values[sort.stat])
        return (-value if sort.direction is SortDirection.DESC else value,)
    ranks = [
        percentiles[sort.stat].rank(values[sort.stat])
        if sort.direction is SortDirection.DESC
        else 1 - percentiles[sort.stat].rank(values[sort.stat])
        for sort in sorts
    ]
    return (-sum(ranks) / len(ranks),)
