"""In-memory adapter of the catalog, facet, name, profile and stat ports."""

from pokedex_search.application.facets import Facet
from pokedex_search.core.ranking.names import NameMatch, NameMatcher
from pokedex_search.core.ranking.stats import Percentiles
from pokedex_search.domain.entities import Entity, EntityKind, EntityRef, Pokemon
from pokedex_search.domain.facts import SearchProfile
from pokedex_search.domain.stats import StatName
from pokedex_search.infrastructure.index_builder import IndexData


class InMemoryIndex:
    """Answers every read port from structures prepared once at startup."""

    def __init__(self, data: IndexData) -> None:
        """Keep the index data and prepare the matchers.

        Args:
            data: Structures built from the snapshot.
        """
        self._data = data
        self._names = NameMatcher(data.names)
        self._percentiles = {stat: Percentiles(values) for stat, values in data.stat_values.items()}
        self._empty = Percentiles(())

    def version(self) -> str:
        """Return the checksum of the dataset served."""
        return self._data.version

    def get(self, ref: EntityRef) -> Entity | None:
        """Return an entity, or None when it does not exist."""
        return self._data.entities.get(ref)

    def refs(self, kind: EntityKind) -> frozenset[EntityRef]:
        """Return every reference of one kind."""
        return self._data.refs_by_kind.get(kind, frozenset())

    def evolution_family(self, pokemon: Pokemon) -> tuple[str, ...]:
        """Return the Pokémon of an evolution chain, in Pokédex order."""
        chain = pokemon.species.evolution_chain_id
        return self._data.families.get(chain, (pokemon.name,)) if chain is not None else ()

    def having(self, facet: Facet) -> frozenset[EntityRef]:
        """Return the entities indexed under a facet."""
        return self._data.facets.get(facet, frozenset())

    def count(self, facet: Facet) -> int:
        """Return how many entities are indexed under a facet."""
        return len(self.having(facet))

    def match(self, term: str, kinds: frozenset[EntityKind]) -> tuple[NameMatch, ...]:
        """Return tiered matches of a name term."""
        return self._names.match(term, kinds)

    def near(self, term: str, kinds: frozenset[EntityKind], edits: int) -> tuple[NameMatch, ...]:
        """Return names within a number of edits of a term."""
        return self._names.near(term, kinds, edits)

    def profile(self, ref: EntityRef) -> SearchProfile:
        """Return the search profile of an entity, empty when it has no fact."""
        return self._data.profiles.get(ref) or SearchProfile(ref=ref, effects=(), weathers=())

    def percentiles(self, stat: StatName) -> Percentiles:
        """Return the distribution of one stat."""
        return self._percentiles.get(stat, self._empty)
