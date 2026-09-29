"""Map errors to the contract's error responses, without leaking internals."""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from pokedex_search.api.http.security import SECURITY_HEADERS
from pokedex_search.api.schemas.common import ErrorBodyDTO, ErrorResponseDTO
from pokedex_search.domain.errors import (
    EntityNotFoundError,
    InvalidParameterError,
    InvalidQueryError,
)

LOGGER = logging.getLogger(__name__)
GENERIC_FAILURE = "The request failed unexpectedly."
QUERY_PARAMETER = "q"


def _response(status: int, body: ErrorBodyDTO) -> JSONResponse:
    return JSONResponse(status_code=status, content=ErrorResponseDTO(error=body).model_dump())


async def _invalid_query(_: Request, error: Exception) -> JSONResponse:
    return _response(400, ErrorBodyDTO(code="invalid_query", message=str(error)))


async def _invalid_parameter(_: Request, error: Exception) -> JSONResponse:
    return _response(400, ErrorBodyDTO(code="invalid_parameter", message=str(error)))


async def _not_found(_: Request, error: Exception) -> JSONResponse:
    return _response(404, ErrorBodyDTO(code="not_found", message=str(error)))


async def _request_validation(_: Request, error: Exception) -> JSONResponse:
    issues = error.errors() if isinstance(error, RequestValidationError) else []
    fields = {str(issue["loc"][-1]) for issue in issues if issue.get("loc")}
    if QUERY_PARAMETER in fields:
        return _response(400, ErrorBodyDTO(code="invalid_query", message="The query is required."))
    names = ", ".join(sorted(fields)) or "request"
    return _response(400, ErrorBodyDTO(code="invalid_parameter", message=f"Invalid {names}."))


async def _unexpected(request: Request, error: Exception) -> JSONResponse:
    LOGGER.error("Unhandled error on %s", request.url.path, exc_info=error)
    response = _response(500, ErrorBodyDTO(code="internal_error", message=GENERIC_FAILURE))
    response.headers.update(SECURITY_HEADERS)
    return response


def register_error_handlers(app: FastAPI) -> None:
    """Install the handlers; the last one is the framework's catch-all for unexpected failures.

    Args:
        app: The application.
    """
    app.add_exception_handler(InvalidQueryError, _invalid_query)
    app.add_exception_handler(InvalidParameterError, _invalid_parameter)
    app.add_exception_handler(EntityNotFoundError, _not_found)
    app.add_exception_handler(RequestValidationError, _request_validation)
    app.add_exception_handler(Exception, _unexpected)
