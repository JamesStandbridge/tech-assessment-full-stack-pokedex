"""Match a name term against entity names by tiers, then by bounded typo distance."""

from collections.abc import Iterable
from enum import IntEnum

from rapidfuzz import process
from rapidfuzz.distance import DamerauLevenshtein

from pokedex_search.domain.entities import EntityKind, EntityRef, Frozen

SHORT_TERM_LENGTH = 5
SHORT_TERM_MAX_EDITS = 1
LONG_TERM_MAX_EDITS = 2


class NameTier(IntEnum):
    """How a name matched, best first."""

    EXACT = 0
    PREFIX = 1
    INFIX = 2
    FUZZY = 3


class NamedEntity(Frozen):
    """An entity reference with its comparison key and dataset id."""

    ref: EntityRef
    key: str
    id: int


class NameMatch(Frozen):
    """An entity whose name matched a term."""

    ref: EntityRef
    tier: NameTier
    distance: int
    length_gap: int


def max_edits(term: str) -> int:
    """Return the typo bound for a term: 1 edit up to 5 characters, 2 beyond."""
    return SHORT_TERM_MAX_EDITS if len(term) <= SHORT_TERM_LENGTH else LONG_TERM_MAX_EDITS


class NameMatcher:
    """Matches terms against a fixed list of entity names."""

    def __init__(self, entities: Iterable[NamedEntity]) -> None:
        """Index the names.

        Args:
            entities: Every entity with its name key.
        """
        self._entities = tuple(entities)

    def match(self, term: str, kinds: frozenset[EntityKind]) -> tuple[NameMatch, ...]:
        """Return literal matches, or typo matches when there is no literal one.

        Args:
            term: Name key of the query.
            kinds: Kinds of entity to consider.

        Returns:
            Matches sorted by tier, distance, length gap and id.
        """
        pool = [entity for entity in self._entities if entity.ref.kind in kinds]
        literal = [self._literal(term, entity) for entity in pool]
        matches = [match for match in literal if match is not None]
        if not matches:
            matches = self._fuzzy(term, pool, max_edits(term))
        ids = {entity.ref: entity.id for entity in pool}
        return tuple(
            sorted(
                matches, key=lambda item: (item.tier, item.distance, item.length_gap, ids[item.ref])
            )
        )

    def near(self, term: str, kinds: frozenset[EntityKind], edits: int) -> tuple[NameMatch, ...]:
        """Return typo matches within a given number of edits, closest first."""
        pool = [entity for entity in self._entities if entity.ref.kind in kinds]
        return tuple(sorted(self._fuzzy(term, pool, edits), key=lambda item: item.distance))

    @staticmethod
    def _literal(term: str, entity: NamedEntity) -> NameMatch | None:
        gap = abs(len(entity.key) - len(term))
        if entity.key == term:
            tier = NameTier.EXACT
        elif entity.key.startswith(term):
            tier = NameTier.PREFIX
        elif term in entity.key:
            tier = NameTier.INFIX
        else:
            return None
        return NameMatch(ref=entity.ref, tier=tier, distance=0, length_gap=gap)

    @staticmethod
    def _fuzzy(term: str, pool: list[NamedEntity], edits: int) -> list[NameMatch]:
        keys = [entity.key for entity in pool]
        found = process.extract(
            term, keys, scorer=DamerauLevenshtein.distance, score_cutoff=edits, limit=None
        )
        return [
            NameMatch(
                ref=pool[index].ref,
                tier=NameTier.FUZZY,
                distance=int(distance),
                length_gap=abs(len(pool[index].key) - len(term)),
            )
            for _, distance, index in found
        ]
