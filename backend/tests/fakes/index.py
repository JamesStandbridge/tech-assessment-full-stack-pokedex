from collections.abc import Iterable

from pokedex_search.application.facets import Facet
from pokedex_search.core.ranking.names import NamedEntity, NameMatch, NameMatcher
from pokedex_search.core.ranking.stats import Percentiles
from pokedex_search.domain.entities import Entity, EntityKind, EntityRef, Pokemon
from pokedex_search.domain.facts import SearchProfile
from pokedex_search.domain.stats import StatName, stat_kind, stat_value


class FakeIndex:
    """Hand-built implementation of every read port, for application tests."""

    def __init__(
        self,
        entities: Iterable[Entity],
        facets: dict[Facet, frozenset[EntityRef]] | None = None,
        profiles: dict[EntityRef, SearchProfile] | None = None,
    ) -> None:
        self._entities = {entity.ref: entity for entity in entities}
        self._facets = facets or {}
        self._profiles = profiles or {}
        self._names = NameMatcher(
            NamedEntity(ref=ref, key=ref.name.replace("-", ""), id=entity.id)
            for ref, entity in self._entities.items()
        )

    def version(self) -> str:
        return "fake-version"

    def get(self, ref: EntityRef) -> Entity | None:
        return self._entities.get(ref)

    def refs(self, kind: EntityKind) -> frozenset[EntityRef]:
        return frozenset(ref for ref in self._entities if ref.kind is kind)

    def evolution_family(self, pokemon: Pokemon) -> tuple[str, ...]:
        return (pokemon.name,)

    def having(self, facet: Facet) -> frozenset[EntityRef]:
        return self._facets.get(facet, frozenset())

    def count(self, facet: Facet) -> int:
        return len(self.having(facet))

    def match(self, term: str, kinds: frozenset[EntityKind]) -> tuple[NameMatch, ...]:
        return self._names.match(term, kinds)

    def near(self, term: str, kinds: frozenset[EntityKind], edits: int) -> tuple[NameMatch, ...]:
        return self._names.near(term, kinds, edits)

    def profile(self, ref: EntityRef) -> SearchProfile:
        return self._profiles.get(ref) or SearchProfile(ref=ref, effects=(), weathers=())

    def percentiles(self, stat: StatName) -> Percentiles:
        values = [
            value
            for entity in self._entities.values()
            if entity.ref.kind is stat_kind(stat)
            and (value := stat_value(entity, stat)) is not None
        ]
        return Percentiles(values)
