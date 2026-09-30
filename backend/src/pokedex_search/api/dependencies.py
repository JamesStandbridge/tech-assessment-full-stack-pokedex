"""Access to the use cases from route handlers, overridable in tests."""

from dataclasses import dataclass

from fastapi import Request

from pokedex_search.application.use_cases import (
    EntityUseCase,
    HealthUseCase,
    SearchUseCase,
    SpeciesUseCase,
    SuggestUseCase,
)


@dataclass(frozen=True, slots=True)
class UseCases:
    """Every use case the HTTP layer exposes."""

    search: SearchUseCase
    entities: EntityUseCase
    species: SpeciesUseCase
    suggest: SuggestUseCase
    health: HealthUseCase


def _use_cases(request: Request) -> UseCases:
    use_cases: UseCases = request.app.state.use_cases
    return use_cases


def search_use_case(request: Request) -> SearchUseCase:
    """Return the search use case."""
    return _use_cases(request).search


def entity_use_case(request: Request) -> EntityUseCase:
    """Return the entity detail use case."""
    return _use_cases(request).entities


def species_use_case(request: Request) -> SpeciesUseCase:
    """Return the species list use case."""
    return _use_cases(request).species


def suggest_use_case(request: Request) -> SuggestUseCase:
    """Return the typing suggestion use case."""
    return _use_cases(request).suggest


def health_use_case(request: Request) -> HealthUseCase:
    """Return the health use case."""
    return _use_cases(request).health
