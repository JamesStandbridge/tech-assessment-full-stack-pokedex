"""Build the FastAPI application around the use cases."""

from collections.abc import Sequence

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pokedex_search.api.dependencies import UseCases
from pokedex_search.api.errors import register_error_handlers
from pokedex_search.api.routes import entities, health, search


def create_app(use_cases: UseCases, cors_origins: Sequence[str]) -> FastAPI:
    """Create the application.

    Args:
        use_cases: Implementations of every use case.
        cors_origins: Origins allowed to call the API from a browser.

    Returns:
        The configured application.
    """
    app = FastAPI(title="Pokédex Search API", version="0.4.0")
    app.state.use_cases = use_cases
    app.add_middleware(
        CORSMiddleware, allow_origins=list(cors_origins), allow_methods=["GET"], allow_headers=["*"]
    )
    register_error_handlers(app)
    for module in (search, entities, health):
        app.include_router(module.router)
    return app
