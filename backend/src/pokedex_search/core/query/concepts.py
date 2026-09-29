"""Meanings a phrase of the query can carry."""

from pokedex_search.domain.entities import EntityRef, Frozen
from pokedex_search.domain.terms import TermRole


class Concept(Frozen):
    """One meaning of a phrase: its role, its normalized value and optional details."""

    role: TermRole
    value: str
    move_value: str | None = None
    comparative: bool = False
    entity: EntityRef | None = None


class Span(Frozen):
    """Consecutive tokens read together, with every meaning they can carry."""

    start: int
    end: int
    concepts: tuple[Concept, ...]

    @property
    def is_known(self) -> bool:
        """Tell whether the span carries at least one meaning."""
        return bool(self.concepts)

    def first(self, role: TermRole) -> Concept | None:
        """Return the first meaning of the span with the given role."""
        return next((concept for concept in self.concepts if concept.role is role), None)


class ResolvedSpan(Frozen):
    """A span with the single meaning retained for it, or none when unknown."""

    start: int
    end: int
    concept: Concept | None
