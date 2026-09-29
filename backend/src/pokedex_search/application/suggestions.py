"""Suggestions for empty outcomes, and the best match of a name query."""

from collections.abc import Sequence

from pokedex_search.application.evaluation.base import ALL_KINDS
from pokedex_search.application.ports import NameIndex
from pokedex_search.core.ranking.names import NameTier, max_edits
from pokedex_search.domain.entities import EntityRef
from pokedex_search.domain.plan import SearchPlan
from pokedex_search.domain.results import Suggestion, SuggestionKind

SUGGESTION_EXTRA_EDITS = 1
MAX_NAME_SUGGESTIONS = 3


class SuggestionBuilder:
    """Offers close names beyond the typo bound, and example queries."""

    def __init__(self, names: NameIndex, examples: Sequence[str]) -> None:
        """Keep the name index and the example queries.

        Args:
            names: Name matching over every entity.
            examples: One example query per supported need.
        """
        self._names = names
        self._examples = tuple(examples)

    def suggestions(self, plans: Sequence[SearchPlan]) -> tuple[Suggestion, ...]:
        """Return suggestions for a query that found nothing."""
        names: list[Suggestion] = []
        for plan in plans:
            if plan.name:
                edits = max_edits(plan.name) + SUGGESTION_EXTRA_EDITS
                near = self._names.near(plan.name, ALL_KINDS, edits)[:MAX_NAME_SUGGESTIONS]
                names.extend(
                    Suggestion(
                        kind=SuggestionKind.NAME,
                        label=f"Did you mean {match.ref.name}?",
                        query=match.ref.name.replace("-", " "),
                    )
                    for match in near
                )
        examples = [
            Suggestion(kind=SuggestionKind.EXAMPLE, label=f"Try '{example}'", query=example)
            for example in self._examples
        ]
        return (*names, *examples)


class BestMatchFinder:
    """Finds the one entity a name query designates, if there is one."""

    def __init__(self, names: NameIndex) -> None:
        """Keep the name index.

        Args:
            names: Name matching over every entity.
        """
        self._names = names

    def best_match(self, plans: Sequence[SearchPlan]) -> EntityRef | None:
        """Return the single exact match, or the name of which the term is the only prefix."""
        for plan in plans:
            if not plan.name:
                continue
            kinds = frozenset(plan.kinds) or ALL_KINDS
            matches = self._names.match(plan.name, kinds)
            for tier in (NameTier.EXACT, NameTier.PREFIX):
                tiered = [match for match in matches if match.tier is tier]
                if len(tiered) == 1:
                    return tiered[0].ref
                if tiered:
                    return None
        return None
