"""Keep one meaning per span, following the documented conflict rules."""

from collections.abc import Sequence

from pokedex_search.core.query.concepts import Concept, ResolvedSpan, Span
from pokedex_search.core.query.phrases import DESCRIPTION_PREFIX
from pokedex_search.domain.terms import TermRole

_EFFECT_CONTEXT = frozenset({TermRole.TARGET, TermRole.MODE})
_STRUCTURAL = frozenset({TermRole.FILLER, TermRole.KIND})
MIN_DESCRIPTION_WORDS = 2


def _has_effect_context(spans: Sequence[Span]) -> bool:
    other_effect = any(
        span.first(TermRole.EFFECT) is not None and span.first(TermRole.TYPE) is None
        for span in spans
    )
    context = any(concept.role in _EFFECT_CONTEXT for span in spans for concept in span.concepts)
    return context and not other_effect


def _has_mention(spans: Sequence[Span]) -> bool:
    return any(span.first(TermRole.NAME) is not None and len(span.concepts) == 1 for span in spans)


def _choose(span: Span, effect_context: bool, mention: bool) -> Concept | None:
    if not span.concepts:
        return None
    effect = span.first(TermRole.EFFECT)
    if effect is not None and span.first(TermRole.TYPE) is not None:
        return effect if effect_context else span.first(TermRole.TYPE)
    chosen = span.concepts[0]
    if chosen.role is TermRole.RELATION and not mention:
        return Concept(role=TermRole.FILLER, value=chosen.value)
    return chosen


def resolve(spans: Sequence[Span]) -> tuple[ResolvedSpan, ...]:
    """Choose one meaning for every span.

    A phrase that is both a type and an effect, such as poison, is the effect only
    when the query also names a target or a mode and no other effect. Vocabulary
    meanings come before
    entity names and genus words. A relation word without an entity mention is
    filler. Description words count only beside another constraint or in pairs.

    Args:
        spans: Matched spans with every meaning they can carry.

    Returns:
        The spans with their retained meaning.
    """
    effect_context = _has_effect_context(spans)
    mention = _has_mention(spans)
    resolved = tuple(
        ResolvedSpan(start=span.start, end=span.end, concept=_choose(span, effect_context, mention))
        for span in spans
    )
    return _without_lone_descriptions(resolved)


def _is_description(span: ResolvedSpan) -> bool:
    return span.concept is not None and span.concept.value.startswith(DESCRIPTION_PREFIX)


def _without_lone_descriptions(spans: tuple[ResolvedSpan, ...]) -> tuple[ResolvedSpan, ...]:
    """Drop description meanings unless the query has another constraint or two such words."""
    descriptions = [span for span in spans if _is_description(span)]
    others = [
        span
        for span in spans
        if span.concept is not None
        and not _is_description(span)
        and span.concept.role not in _STRUCTURAL
    ]
    if others or len(descriptions) >= MIN_DESCRIPTION_WORDS:
        return spans
    return tuple(
        ResolvedSpan(start=span.start, end=span.end, concept=None)
        if _is_description(span)
        else span
        for span in spans
    )
