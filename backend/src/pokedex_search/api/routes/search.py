"""GET /api/search."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from pokedex_search.api.dependencies import search_use_case
from pokedex_search.api.mappers.search import to_search_response
from pokedex_search.api.schemas.search import SearchResponseDTO
from pokedex_search.application.pagination import DEFAULT_LIMIT, PageRequest
from pokedex_search.application.search_service import SearchRequest
from pokedex_search.application.use_cases import SearchUseCase
from pokedex_search.domain.entities import EntityKind

router = APIRouter()


@router.get("/api/search", response_model=SearchResponseDTO, response_model_by_alias=True)
def search(
    use_case: Annotated[SearchUseCase, Depends(search_use_case)],
    q: Annotated[str, Query()],
    kind: Annotated[EntityKind | None, Query()] = None,
    limit: Annotated[int, Query()] = DEFAULT_LIMIT,
    cursor: Annotated[str | None, Query()] = None,
) -> SearchResponseDTO:
    """Search the Pokédex."""
    request = SearchRequest(query=q, page=PageRequest(kind=kind, limit=limit, cursor=cursor))
    return to_search_response(use_case.search(request))
