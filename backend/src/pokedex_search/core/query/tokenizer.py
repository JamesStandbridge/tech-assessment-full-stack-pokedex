"""Split a query into word tokens that keep their position in the original text."""

import re

from pokedex_search.core.query.normalizer import fold_word
from pokedex_search.domain.entities import Frozen

_TOKEN = re.compile(r"#?[^\W_]+(?:['\u2019][^\W_]+)*")


class Token(Frozen):
    """A word of the query, as written and folded, with its span."""

    text: str
    word: str
    start: int
    end: int


def tokenize(query: str) -> tuple[Token, ...]:
    """Split a query on everything that is not a letter, a digit or an inner apostrophe.

    Args:
        query: Query as typed.

    Returns:
        The tokens, in order.
    """
    return tuple(
        Token(
            text=match.group(), word=fold_word(match.group()), start=match.start(), end=match.end()
        )
        for match in _TOKEN.finditer(query)
    )
