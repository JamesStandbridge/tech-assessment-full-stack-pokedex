"""GET /api/health."""

from typing import Annotated

from fastapi import APIRouter, Depends

from pokedex_search.api.dependencies import health_use_case
from pokedex_search.api.schemas.common import HealthDTO
from pokedex_search.application.use_cases import HealthUseCase

router = APIRouter()


@router.get("/api/health", response_model=HealthDTO)
def health(use_case: Annotated[HealthUseCase, Depends(health_use_case)]) -> HealthDTO:
    """Report whether the dataset is loaded."""
    return HealthDTO(dataset_sha256=use_case.dataset_version())
