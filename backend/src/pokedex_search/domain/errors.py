"""Errors the domain and the services raise on purpose."""

from pokedex_search.domain.entities import EntityRef


class PokedexError(Exception):
    """Base of every expected error."""


class InvalidQueryError(PokedexError):
    """Raised when a query breaks the input rules."""


class InvalidParameterError(PokedexError):
    """Raised when a request parameter, such as a cursor, is invalid."""


class EntityNotFoundError(PokedexError):
    """Raised when no entity has the requested kind and name."""

    def __init__(self, ref: EntityRef) -> None:
        """Keep the missing reference.

        Args:
            ref: The reference that matched nothing.
        """
        super().__init__(f"No {ref.kind} is named {ref.name!r}.")
        self.ref = ref


class DatasetIntegrityError(PokedexError):
    """Raised when the dataset file is not the published snapshot."""
