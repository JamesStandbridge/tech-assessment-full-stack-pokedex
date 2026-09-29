"""A query that passed the input rules."""

from pokedex_search.domain.entities import Frozen


class ValidQuery(Frozen):
    """A trimmed query within the allowed length."""

    text: str
