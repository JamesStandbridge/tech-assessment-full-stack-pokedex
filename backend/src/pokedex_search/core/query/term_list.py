"""Report every span of the query with the role it was read in."""

from collections.abc import Sequence

from pokedex_search.core.query.concepts import ResolvedSpan
from pokedex_search.core.query.normalizer import name_key
from pokedex_search.core.query.tokenizer import Token
from pokedex_search.domain.terms import Term, TermRole


def span_text(query: str, tokens: Sequence[Token], span: ResolvedSpan) -> str:
    """Return the text of a span exactly as typed, including inner punctuation."""
    return query[tokens[span.start].start : tokens[span.end - 1].end]


def build_terms(
    query: str, tokens: Sequence[Token], spans: Sequence[ResolvedSpan], name_reading: bool
) -> tuple[Term, ...]:
    """Describe every span of the query.

    Args:
        query: Query as typed.
        tokens: Its tokens.
        spans: Resolved spans covering every token.
        name_reading: Whether unknown words are read as a name to look up.

    Returns:
        One term per span, in query order.
    """
    terms: list[Term] = []
    for span in spans:
        text = span_text(query, tokens, span)
        concept = span.concept
        if concept is None:
            role = TermRole.NAME if name_reading else TermRole.IGNORED
            value = name_key(text) if name_reading else None
            terms.append(Term(text=text, role=role, value=value))
        elif concept.role is TermRole.FILLER:
            terms.append(Term(text=text, role=TermRole.FILLER, value=None))
        else:
            terms.append(Term(text=text, role=concept.role, value=concept.value))
    return tuple(terms)
