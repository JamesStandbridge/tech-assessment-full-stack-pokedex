"""Interfaces the application depends on; adapters implement them."""

from typing import Protocol

from pokedex_search.application.facets import Facet
from pokedex_search.core.ranking.names import NameMatch
from pokedex_search.core.ranking.stats import Percentiles
from pokedex_search.domain.entities import Entity, EntityKind, EntityRef, Pokemon
from pokedex_search.domain.facts import SearchProfile
from pokedex_search.domain.plan import SearchPlan
from pokedex_search.domain.query import ValidQuery
from pokedex_search.domain.results import Interpretation, Refinement
from pokedex_search.domain.stats import StatName
from pokedex_search.domain.suggestions import TypingSuggestion


class EntityCatalog(Protocol):
    """Read access to entities."""

    def version(self) -> str:
        """Return the checksum of the dataset served."""
        ...

    def get(self, ref: EntityRef) -> Entity | None:
        """Return an entity, or None when it does not exist."""
        ...

    def refs(self, kind: EntityKind) -> frozenset[EntityRef]:
        """Return every reference of one kind."""
        ...

    def evolution_family(self, pokemon: Pokemon) -> tuple[str, ...]:
        """Return the Pokémon of an evolution chain, in Pokédex order."""
        ...


class FacetIndex(Protocol):
    """Inverted index from facets to entities."""

    def having(self, facet: Facet) -> frozenset[EntityRef]:
        """Return the entities indexed under a facet."""
        ...

    def count(self, facet: Facet) -> int:
        """Return how many entities are indexed under a facet."""
        ...


class NameIndex(Protocol):
    """Name matching over every entity."""

    def match(self, term: str, kinds: frozenset[EntityKind]) -> tuple[NameMatch, ...]:
        """Return tiered matches of a name term."""
        ...

    def near(self, term: str, kinds: frozenset[EntityKind], edits: int) -> tuple[NameMatch, ...]:
        """Return names within a number of edits of a term."""
        ...


class ProfileStore(Protocol):
    """Denormalized facts of every entity."""

    def profile(self, ref: EntityRef) -> SearchProfile:
        """Return the search profile of an entity."""
        ...


class StatDistribution(Protocol):
    """Distributions of stats, for percentile ranks."""

    def percentiles(self, stat: StatName) -> Percentiles:
        """Return the distribution of one stat."""
        ...


class DescriptionIndex(Protocol):
    """Full-text search over species descriptions."""

    def search(self, words: tuple[str, ...]) -> dict[EntityRef, float]:
        """Return Pokémon whose description contains any word, with a relevance score."""
        ...


class QueryParser(Protocol):
    """Reads a query into terms and plans."""

    def parse(self, query: ValidQuery) -> Interpretation:
        """Read a valid query."""
        ...


class ConceptSource(Protocol):
    """Completes partial queries with vocabulary concepts."""

    def complete(self, partial: str, limit: int) -> tuple[TypingSuggestion, ...]:
        """Return concepts completing the last word of a partial query."""
        ...


class PlanWriter(Protocol):
    """Writes plans as canonical queries, and derives refinements."""

    def serialize(self, plan: SearchPlan) -> str:
        """Return the canonical query of a plan."""
        ...

    def refinements(self, plan: SearchPlan) -> tuple[Refinement, ...]:
        """Return ready-to-run adjustments of a plan."""
        ...
