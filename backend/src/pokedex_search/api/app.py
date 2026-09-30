"""Build the FastAPI application around the use cases."""

from collections.abc import Sequence

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware

from pokedex_search.api.dependencies import UseCases
from pokedex_search.api.errors import register_error_handlers
from pokedex_search.api.http.entity_tags import EntityTagMiddleware
from pokedex_search.api.http.head import HeadMiddleware
from pokedex_search.api.http.security import SecurityHeadersMiddleware
from pokedex_search.api.routes import entities, health, search, species

COMPRESSION_MINIMUM_BYTES = 1000


def create_app(use_cases: UseCases, cors_origins: Sequence[str]) -> FastAPI:
    """Create the application.

    Middlewares, from the outermost: HEAD served as GET, security headers,
    CORS, compression, then entity tags computed on the uncompressed body.

    Args:
        use_cases: Implementations of every use case.
        cors_origins: Origins allowed to call the API from a browser.

    Returns:
        The configured application.
    """
    app = FastAPI(title="Pokédex Search API", version="0.5.0")
    app.state.use_cases = use_cases
    app.add_middleware(EntityTagMiddleware)
    app.add_middleware(GZipMiddleware, minimum_size=COMPRESSION_MINIMUM_BYTES)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(cors_origins),
        allow_methods=["GET", "HEAD"],
        allow_headers=["*"],
        expose_headers=["ETag"],
    )
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(HeadMiddleware)
    register_error_handlers(app)
    for module in (search, entities, species, health):
        app.include_router(module.router)
    return app
