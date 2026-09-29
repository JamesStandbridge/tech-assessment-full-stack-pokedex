"""Keep one meaning per span, following the documented conflict rules."""

from collections.abc import Sequence

from pokedex_search.core.query.concepts import Concept, ResolvedSpan, Span
from pokedex_search.core.query.phrases import DESCRIPTION_PREFIX
from pokedex_search.domain.entities import EntityKind
from pokedex_search.domain.terms import TermRole

_EFFECT_CONTEXT = frozenset({TermRole.TARGET, TermRole.MODE})
_STRUCTURAL = frozenset({TermRole.FILLER, TermRole.KIND})
MIN_DESCRIPTION_WORDS = 2


def _is_type_and_effect(span: Span) -> bool:
    return span.first(TermRole.EFFECT) is not None and span.first(TermRole.TYPE) is not None


def _type_effect_index(spans: Sequence[Span]) -> int | None:
    """Return the span read as the effect among those that are both a type and an effect."""
    other_effect = any(
        span.first(TermRole.EFFECT) is not None and span.first(TermRole.TYPE) is None
        for span in spans
    )
    contexts = [
        index
        for index, span in enumerate(spans)
        if any(concept.role in _EFFECT_CONTEXT for concept in span.concepts)
    ]
    candidates = [index for index, span in enumerate(spans) if _is_type_and_effect(span)]
    if other_effect or not contexts or not candidates:
        return None
    return min(
        candidates,
        key=lambda index: (min(abs(index - context) for context in contexts), -index),
    )


def _has_mention(spans: Sequence[Span]) -> bool:
    return any(span.first(TermRole.NAME) is not None and len(span.concepts) == 1 for span in spans)


def _choose(span: Span, as_effect: bool, mention: bool) -> Concept | None:
    if not span.concepts:
        return None
    if _is_type_and_effect(span):
        return span.first(TermRole.EFFECT) if as_effect else span.first(TermRole.TYPE)
    chosen = span.concepts[0]
    if chosen.role is TermRole.RELATION and not mention:
        return Concept(role=TermRole.FILLER, value=chosen.value)
    return chosen


def resolve(spans: Sequence[Span]) -> tuple[ResolvedSpan, ...]:
    """Choose one meaning for every span.

    A phrase that is both a type and an effect, such as poison, is the effect only
    when the query also names a target or a mode and no other effect, and only the
    one closest to that target or mode; a move kind word right after it then
    qualifies it and is filler, as in immune to ground moves. Vocabulary meanings
    come before
    entity names and genus words. A relation word without an entity mention is
    filler. Description words count only beside another constraint or in pairs.

    Args:
        spans: Matched spans with every meaning they can carry.

    Returns:
        The spans with their retained meaning.
    """
    effect_index = _type_effect_index(spans)
    mention = _has_mention(spans)
    resolved = tuple(
        ResolvedSpan(
            start=span.start,
            end=span.end,
            concept=_choose(span, index == effect_index, mention),
        )
        for index, span in enumerate(spans)
    )
    return _without_lone_descriptions(_without_type_qualifiers(spans, resolved))


def _is_type_effect(span: Span, resolved: ResolvedSpan) -> bool:
    return (
        resolved.concept is not None
        and resolved.concept.role is TermRole.EFFECT
        and span.first(TermRole.TYPE) is not None
    )


def _without_type_qualifiers(
    spans: Sequence[Span], resolved: tuple[ResolvedSpan, ...]
) -> tuple[ResolvedSpan, ...]:
    """Turn a move kind word that follows a type read as an effect into filler."""
    kept = list(resolved)
    for index in range(1, len(kept)):
        concept = kept[index].concept
        if concept is None or concept.role is not TermRole.KIND:
            continue
        if concept.value == EntityKind.MOVE and _is_type_effect(spans[index - 1], kept[index - 1]):
            filler = Concept(role=TermRole.FILLER, value=concept.value)
            kept[index] = kept[index].model_copy(update={"concept": filler})
    return tuple(kept)


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
