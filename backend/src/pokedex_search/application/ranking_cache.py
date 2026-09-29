"""Bounded cache of complete rankings, so that later pages do not re-rank."""

from collections import OrderedDict

from pokedex_search.application.evaluation.registry import PlanRanking


class RankingCache:
    """Least-recently-used cache of rankings keyed by fingerprint."""

    def __init__(self, capacity: int) -> None:
        """Create an empty cache.

        Args:
            capacity: Maximum number of rankings kept.
        """
        self._capacity = capacity
        self._entries: OrderedDict[str, tuple[PlanRanking, ...]] = OrderedDict()

    def get(self, key: str) -> tuple[PlanRanking, ...] | None:
        """Return a cached ranking and mark it as recently used."""
        entry = self._entries.get(key)
        if entry is not None:
            self._entries.move_to_end(key)
        return entry

    def put(self, key: str, rankings: tuple[PlanRanking, ...]) -> None:
        """Store a ranking, evicting the least recently used one when full."""
        self._entries[key] = rankings
        self._entries.move_to_end(key)
        while len(self._entries) > self._capacity:
            self._entries.popitem(last=False)
