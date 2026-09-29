"""Wire shapes shared by several endpoints."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from pokedex_search.domain.entities import EntityKind


class Wire(BaseModel):
    """Base of every response body."""

    model_config = ConfigDict(frozen=True, populate_by_name=True)


class EntityRefDTO(Wire):
    """An entity reference."""

    kind: EntityKind
    name: str


class StatsDTO(Wire):
    """Base stats, with the dataset's hyphenated names on the wire."""

    hp: int
    attack: int
    defense: int
    special_attack: int = Field(serialization_alias="special-attack")
    special_defense: int = Field(serialization_alias="special-defense")
    speed: int


class ErrorBodyDTO(Wire):
    """Machine-readable error."""

    code: Literal["invalid_query", "invalid_parameter", "not_found", "internal_error"]
    message: str


class ErrorResponseDTO(Wire):
    """Body of every error response."""

    error: ErrorBodyDTO


class HealthDTO(Wire):
    """Readiness of the service."""

    status: Literal["ok"] = "ok"
    dataset_sha256: str
