"""Pages and cursors: stateless, bound to the query, the section and the dataset."""

import hashlib
from collections.abc import Sequence
from typing import Protocol

from pokedex_search.domain.entities import EntityKind, Frozen
from pokedex_search.domain.plan import SearchPlan

DEFAULT_LIMIT = 20
MAX_LIMIT = 100
FINGERPRINT_LENGTH = 16


class Cursor(Frozen):
    """Where the next page of a section starts."""

    kind: EntityKind
    offset: int
    fingerprint: str


class PageRequest(Frozen):
    """Pagination parameters of a search request."""

    kind: EntityKind | None = None
    limit: int = DEFAULT_LIMIT
    cursor: str | None = None


class CursorCodec(Protocol):
    """Turns cursors into opaque tokens and back."""

    def encode(self, cursor: Cursor) -> str:
        """Return the token of a cursor."""
        ...

    def decode(self, token: str) -> Cursor:
        """Return the cursor of a token, or raise InvalidParameterError."""
        ...


def fingerprint(version: str, plans: Sequence[SearchPlan]) -> str:
    """Identify a ranking: the dataset version and the plans that produced it."""
    content = version + "|" + "|".join(plan.model_dump_json() for plan in plans)
    return hashlib.sha256(content.encode()).hexdigest()[:FINGERPRINT_LENGTH]
