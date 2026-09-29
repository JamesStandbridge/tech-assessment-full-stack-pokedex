"""GET /api/entities/{kind}/{name} and GET /api/suggest."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from pokedex_search.api.dependencies import entity_use_case, suggest_use_case
from pokedex_search.api.mappers.entities import to_entity_detail, to_suggest_response
from pokedex_search.api.schemas.entities import EntityDetailDTO, SuggestResponseDTO
from pokedex_search.application.use_cases import EntityUseCase, SuggestUseCase
from pokedex_search.domain.entities import EntityKind

router = APIRouter()


@router.get("/api/entities/{kind}/{name}", response_model=EntityDetailDTO)
def get_entity(
    use_case: Annotated[EntityUseCase, Depends(entity_use_case)], kind: EntityKind, name: str
) -> EntityDetailDTO:
    """Return one entity with its relations."""
    return to_entity_detail(use_case.get(kind, name))


@router.get("/api/suggest", response_model=SuggestResponseDTO)
def suggest(
    use_case: Annotated[SuggestUseCase, Depends(suggest_use_case)], q: Annotated[str, Query()]
) -> SuggestResponseDTO:
    """Suggest names and concepts while the user types."""
    return to_suggest_response(use_case.suggest(q))
