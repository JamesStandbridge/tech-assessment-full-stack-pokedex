"""GET /api/species."""

from typing import Annotated

from fastapi import APIRouter, Depends

from pokedex_search.api.dependencies import species_use_case
from pokedex_search.api.mappers.entities import to_species_response
from pokedex_search.api.schemas.entities import SpeciesResponseDTO
from pokedex_search.application.use_cases import SpeciesUseCase

router = APIRouter()


@router.get("/api/species", response_model=SpeciesResponseDTO)
def list_species(
    use_case: Annotated[SpeciesUseCase, Depends(species_use_case)],
) -> SpeciesResponseDTO:
    """List every Pokémon with its number, types, base stats and sprite."""
    return to_species_response(use_case.species())
