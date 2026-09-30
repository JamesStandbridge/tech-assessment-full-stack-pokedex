"""Inbound interfaces the HTTP layer calls; services implement them."""

from typing import Protocol

from pokedex_search.application.search_service import SearchRequest
from pokedex_search.domain.details import EntityDetail
from pokedex_search.domain.entities import EntityKind, Pokemon
from pokedex_search.domain.results import SearchResult
from pokedex_search.domain.suggestions import TypingSuggestion


class SearchUseCase(Protocol):
    """Answers search requests."""

    def search(self, request: SearchRequest) -> SearchResult:
        """Answer one request."""
        ...


class EntityUseCase(Protocol):
    """Returns entity details."""

    def get(self, kind: EntityKind, name: str) -> EntityDetail:
        """Return one entity with its relations."""
        ...


class SpeciesUseCase(Protocol):
    """Lists every Pokémon."""

    def species(self) -> tuple[Pokemon, ...]:
        """Return every Pokémon, in Pokédex order."""
        ...


class SuggestUseCase(Protocol):
    """Suggests names and concepts while the user types."""

    def suggest(self, partial: str) -> tuple[TypingSuggestion, ...]:
        """Return suggestions for a partial query."""
        ...


class HealthUseCase(Protocol):
    """Reports readiness."""

    def dataset_version(self) -> str:
        """Return the checksum of the dataset served."""
        ...
