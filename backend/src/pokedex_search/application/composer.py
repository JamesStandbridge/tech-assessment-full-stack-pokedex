"""Compose the interpretive parts of a response around the ranked results."""

from pydantic import BaseModel, ConfigDict

from pokedex_search.application.notices import NoticeBuilder
from pokedex_search.application.ports import PlanWriter
from pokedex_search.application.ranking_service import MergedRanking
from pokedex_search.application.suggestions import BestMatchFinder, SuggestionBuilder
from pokedex_search.domain.entities import EntityRef
from pokedex_search.domain.results import Interpretation, Notice, Refinement, Suggestion
from pokedex_search.domain.terms import Term, TermRole


class ResponseParts(BaseModel):
    """Everything a response says about the query, beside the results."""

    model_config = ConfigDict(frozen=True)

    interpretation: Interpretation
    canonical_query: str | None
    notices: tuple[Notice, ...]
    explanation: str | None
    suggestions: tuple[Suggestion, ...]
    best_match: EntityRef | None
    refinements: tuple[Refinement, ...]


class ResponseComposer:
    """Builds notices, explanations, suggestions, best match and refinements."""

    def __init__(
        self,
        notices: NoticeBuilder,
        suggestions: SuggestionBuilder,
        best_match: BestMatchFinder,
        writer: PlanWriter,
    ) -> None:
        """Keep the builders.

        Args:
            notices: Builder of notices and explanations.
            suggestions: Builder of suggestions for empty outcomes.
            best_match: Finder of the entity a name query designates.
            writer: Writer of canonical queries and refinements.
        """
        self._notices = notices
        self._suggestions = suggestions
        self._best_match = best_match
        self._writer = writer

    def compose(self, interpretation: Interpretation, ranking: MergedRanking) -> ResponseParts:
        """Return the interpretive parts of the response."""
        if ranking.is_empty:
            interpretation = self._unmatched_names_ignored(interpretation)
        plans = interpretation.alternatives
        first = plans[0] if plans else None
        return ResponseParts(
            interpretation=interpretation,
            canonical_query=self._writer.serialize(first) if first else None,
            notices=self._notices.notices(interpretation, ranking.approximate),
            explanation=self._notices.explanation(interpretation) if ranking.is_empty else None,
            suggestions=self._suggestions.suggestions(plans) if ranking.is_empty else (),
            best_match=None if ranking.is_empty else self._best_match.best_match(plans),
            refinements=self._writer.refinements(first) if first and not ranking.is_empty else (),
        )

    @staticmethod
    def _unmatched_names_ignored(interpretation: Interpretation) -> Interpretation:
        if not all(plan.name for plan in interpretation.alternatives):
            return interpretation
        terms = tuple(
            Term(text=term.text, role=TermRole.IGNORED, value=None)
            if term.role is TermRole.NAME
            else term
            for term in interpretation.terms
        )
        return interpretation.model_copy(update={"terms": terms})
