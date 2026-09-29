"""Read a query into its terms and one or more conjunctive plans."""

from collections.abc import Sequence

from pokedex_search.core.query.builder import PlanBuilder
from pokedex_search.core.query.concepts import ResolvedSpan, Span
from pokedex_search.core.query.conflicts import resolve
from pokedex_search.core.query.normalizer import name_key
from pokedex_search.core.query.phrases import PhraseTable, match_spans
from pokedex_search.core.query.summary import describe
from pokedex_search.core.query.term_list import build_terms, span_text
from pokedex_search.core.query.tokenizer import Token, tokenize
from pokedex_search.domain.entities import EntityKind, Frozen
from pokedex_search.domain.plan import SearchPlan
from pokedex_search.domain.query import ValidQuery
from pokedex_search.domain.results import Interpretation
from pokedex_search.domain.terms import TermRole

_STRUCTURAL = frozenset({TermRole.FILLER, TermRole.KIND})
_NUMBERS = frozenset({TermRole.DEX_NUMBER, TermRole.NUMBER})


class _Reading(Frozen):
    alternatives: tuple[SearchPlan, ...]
    name_reading: bool


class VocabularyQueryParser:
    """Parses queries with the vocabulary and entity names of a phrase table."""

    def __init__(self, table: PhraseTable) -> None:
        """Keep the phrase table.

        Args:
            table: Vocabulary phrases, entity names and genus words.
        """
        self._table = table

    def parse(self, query: ValidQuery) -> Interpretation:
        """Read a valid query.

        Args:
            query: The trimmed query.

        Returns:
            Its terms, its alternative plans and a summary.
        """
        tokens = tokenize(query.text)
        spans = match_spans(tokens, self._table)
        resolved = resolve(spans)
        reading = self._read(query.text, tokens, spans, resolved)
        terms = build_terms(query.text, tokens, resolved, reading.name_reading)
        summary = " or ".join(describe(plan) for plan in reading.alternatives)
        return Interpretation(terms=terms, alternatives=reading.alternatives, summary=summary)

    def _read(
        self,
        text: str,
        tokens: Sequence[Token],
        spans: Sequence[Span],
        resolved: Sequence[ResolvedSpan],
    ) -> _Reading:
        kinds = tuple(
            dict.fromkeys(
                EntityKind(span.concept.value)
                for span in resolved
                if span.concept is not None and span.concept.role is TermRole.KIND
            )
        )
        meaningful = [
            index
            for index, span in enumerate(resolved)
            if span.concept is None or span.concept.role not in _STRUCTURAL
        ]
        if meaningful and all(resolved[index].concept is None for index in meaningful):
            words = "".join(span_text(text, tokens, resolved[index]) for index in meaningful)
            return _Reading(
                alternatives=(SearchPlan(kinds=kinds, name=name_key(words)),), name_reading=True
            )
        if len(meaningful) == 1:
            single = self._single(spans[meaningful[0]], resolved[meaningful[0]], kinds)
            if single is not None:
                return _Reading(alternatives=single, name_reading=False)
        concepts = [span.concept for span in resolved if span.concept is not None]
        plan = PlanBuilder(concepts).build()
        if not meaningful and not kinds:
            return _Reading(alternatives=(), name_reading=False)
        return _Reading(alternatives=(plan,), name_reading=False)

    @staticmethod
    def _single(
        span: Span, resolved: ResolvedSpan, kinds: tuple[EntityKind, ...]
    ) -> tuple[SearchPlan, ...] | None:
        concept = resolved.concept
        if concept is None:
            return None
        if concept.role in _NUMBERS:
            return (SearchPlan(kinds=kinds, dex_number=int(concept.value)),)
        name = span.first(TermRole.NAME)
        if name is None or name.entity is None:
            return None
        if concept.role is TermRole.NAME and kinds and name.entity.kind not in kinds:
            return None
        name_plan = SearchPlan(kinds=kinds, name=name_key(name.entity.name))
        if concept.role is TermRole.NAME:
            return (name_plan,)
        concept_plan = PlanBuilder([concept]).build().model_copy(update={"kinds": kinds})
        return (concept_plan, name_plan)
