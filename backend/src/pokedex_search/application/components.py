"""Interfaces of the search service's collaborators, so they can be substituted in tests."""

from collections.abc import Sequence
from typing import Protocol

from pokedex_search.application.composer import ResponseParts
from pokedex_search.application.ranking_service import MergedRanking
from pokedex_search.domain.plan import SearchPlan
from pokedex_search.domain.results import Interpretation


class Ranker(Protocol):
    """Ranks the alternative plans of a query."""

    def rank(self, plans: Sequence[SearchPlan]) -> MergedRanking:
        """Return the merged ranking of the plans."""
        ...


class Composer(Protocol):
    """Builds the interpretive parts of a response."""

    def compose(self, interpretation: Interpretation, ranking: MergedRanking) -> ResponseParts:
        """Return the parts of the response beside the results."""
        ...
