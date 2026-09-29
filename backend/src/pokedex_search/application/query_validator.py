"""Enforce the input rules on raw queries."""

from pokedex_search.domain.errors import InvalidQueryError
from pokedex_search.domain.query import ValidQuery

MIN_QUERY_LENGTH = 2
MAX_QUERY_LENGTH = 200


class QueryValidator:
    """Trims queries and rejects those outside the allowed length."""

    def validate(self, raw: str) -> ValidQuery:
        """Return the trimmed query.

        Args:
            raw: Query as received.

        Returns:
            The trimmed query.

        Raises:
            InvalidQueryError: If it is shorter than 2 or longer than 200 characters.
        """
        text = raw.strip()
        if not MIN_QUERY_LENGTH <= len(text) <= MAX_QUERY_LENGTH:
            raise InvalidQueryError(
                f"The query must contain between {MIN_QUERY_LENGTH} and "
                f"{MAX_QUERY_LENGTH} characters."
            )
        return ValidQuery(text=text)
