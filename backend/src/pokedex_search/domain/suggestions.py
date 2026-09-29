"""Suggestions offered while the user types."""

from enum import StrEnum

from pokedex_search.domain.entities import EntityRef, Frozen
from pokedex_search.domain.terms import TermRole


class TypingSuggestionKind(StrEnum):
    """Whether a suggestion names an entity or a vocabulary concept."""

    ENTITY = "entity"
    CONCEPT = "concept"


class TypingSuggestion(Frozen):
    """A completion of a partial query."""

    kind: TypingSuggestionKind
    label: str
    query: str
    entity: EntityRef | None = None
    concept_role: TermRole | None = None
    concept_value: str | None = None
